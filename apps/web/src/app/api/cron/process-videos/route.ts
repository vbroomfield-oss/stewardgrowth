import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSocialVideo, checkVideoStatus } from '@/lib/video'
import { generateVideo, getVideoStatus as getHeyGenStatus } from '@/lib/video/heygen'

function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

const VIDEO_PLATFORMS = ['tiktok', 'youtube', 'facebook', 'instagram']

// HeyGen platforms get AI avatar talking-head videos
// Shotstack platforms get ecommerce slideshow ad videos
const HEYGEN_PLATFORMS = ['tiktok', 'youtube']
const SHOTSTACK_PLATFORMS = ['facebook', 'instagram']

const MAX_VIDEO_ATTEMPTS = 3

/**
 * Check if a DALL-E generated URL has expired (they last ~1 hour)
 */
function isPermanentUrl(url: string): boolean {
  return (
    !url.includes('oaidalleapiprodscus') &&
    !url.includes('dalleprodsec') &&
    !url.startsWith('data:')
  )
}

/**
 * GET /api/cron/process-videos
 *
 * Runs every 10 minutes (configured in vercel.json)
 *
 * Video engines:
 * - HeyGen: AI avatar talking-head videos for TikTok & YouTube
 * - Shotstack: Ecommerce slideshow ads for Facebook & Instagram
 *
 * Pipeline: Finds posts with videoScript → generates video → polls status → updates DB
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hasHeyGen = !!process.env.HEYGEN_API_KEY
  const hasShotstack = !!process.env.SHOTSTACK_API_KEY

  if (!hasHeyGen && !hasShotstack) {
    return NextResponse.json({
      message: 'No video engines configured (need HEYGEN_API_KEY or SHOTSTACK_API_KEY)',
      skipped: true,
    })
  }

  try {
    console.log(`[Cron] Processing videos... (HeyGen: ${hasHeyGen ? 'yes' : 'no'}, Shotstack: ${hasShotstack ? 'yes' : 'no'})`)

    const results = {
      started: 0,
      completed: 0,
      failed: 0,
      pending: 0,
      skippedMaxAttempts: 0,
    }

    // ──────────────────────────────────────────────
    // 1. START NEW VIDEO GENERATION
    // ──────────────────────────────────────────────

    const needsGeneration = await db.contentPost.findMany({
      where: {
        platforms: { hasSome: VIDEO_PLATFORMS },
        status: 'AWAITING_APPROVAL',
        brand: { isActive: true, deletedAt: null },
      },
      include: {
        brand: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    console.log(`[Video] Found ${needsGeneration.length} candidate posts`)

    const toGenerate = needsGeneration.filter(content => {
      const platformVersions = (content.platformVersions as Record<string, any>) || {}
      const videoPlatform = content.platforms.find(p => VIDEO_PLATFORMS.includes(p))
      if (!videoPlatform) return false
      const platformData = platformVersions[videoPlatform]
      // Must have a video script, no existing render, and no HeyGen video in progress
      return (
        platformData?.videoScript &&
        !platformData?.renderId &&
        !platformData?.heygenVideoId &&
        platformData?.videoStatus !== 'completed' &&
        platformData?.videoStatus !== 'failed'
      )
    }).slice(0, 1) // Process 1 at a time to stay within 300s timeout

    console.log(`[Video] ${toGenerate.length} posts need video generation`)

    for (const content of toGenerate) {
      const platformVersions = (content.platformVersions as Record<string, any>) || {}
      const videoPlatform = content.platforms.find(p => VIDEO_PLATFORMS.includes(p)) as 'tiktok' | 'youtube' | 'facebook' | 'instagram'
      if (!videoPlatform) continue

      const platformData = platformVersions[videoPlatform]

      // Check retry limit — skip posts that have failed too many times
      const attempts = (platformData.videoAttempts as number) || 0
      if (attempts >= MAX_VIDEO_ATTEMPTS) {
        console.log(`[Video] Skipping ${content.id} — ${attempts} failed attempts (max ${MAX_VIDEO_ATTEMPTS})`)
        results.skippedMaxAttempts++

        // Mark as permanently failed
        if (platformData.videoStatus !== 'failed') {
          await db.contentPost.update({
            where: { id: content.id },
            data: {
              platformVersions: {
                ...platformVersions,
                [videoPlatform]: {
                  ...platformData,
                  videoStatus: 'failed',
                  videoError: `Failed after ${MAX_VIDEO_ATTEMPTS} attempts`,
                },
              },
            },
          })
        }
        continue
      }

      // Increment attempt counter
      const newAttempts = attempts + 1

      // Determine which engine to use
      const useHeyGen = hasHeyGen && HEYGEN_PLATFORMS.includes(videoPlatform)
      const useShotstack = hasShotstack && SHOTSTACK_PLATFORMS.includes(videoPlatform)

      // If no engine available for this platform, fall back to the other
      const engine = useHeyGen ? 'heygen' : useShotstack ? 'shotstack' :
        hasHeyGen ? 'heygen' : hasShotstack ? 'shotstack' : null

      if (!engine) {
        console.log(`[Video] No video engine available for ${videoPlatform}`)
        continue
      }

      try {
        console.log(`[Video] Starting ${engine} generation for ${content.id} (${videoPlatform}), attempt ${newAttempts}/${MAX_VIDEO_ATTEMPTS}...`)

        if (engine === 'heygen') {
          // ── HeyGen: AI Avatar Talking-Head Video ──
          const { videoId } = await generateVideo({
            script: platformData.videoScript,
            aspectRatio: videoPlatform === 'youtube' ? '16:9' : '9:16',
            title: `${content.brand?.name || 'Brand'} - ${videoPlatform}`,
            test: process.env.NODE_ENV === 'development',
          })

          await db.contentPost.update({
            where: { id: content.id },
            data: {
              platformVersions: {
                ...platformVersions,
                [videoPlatform]: {
                  ...platformData,
                  heygenVideoId: videoId,
                  videoEngine: 'heygen',
                  videoStatus: 'processing',
                  videoAttempts: newAttempts,
                },
              },
            },
          })

          results.started++
          console.log(`[Video] HeyGen started: ${videoId}`)

        } else {
          // ── Shotstack: Ecommerce Slideshow Ad Video ──
          const brandSettings = (content.brand?.settings as Record<string, any>) || {}
          const brandColor = (brandSettings.color as string) || '#1a1a2e'
          const brandLogoUrl = brandSettings.logoUrl || content.brand?.logo || undefined

          // Collect permanent images only (brand logos, book covers — not expired DALL-E URLs)
          const existingImages: string[] = []
          if (platformData.imageUrl && isPermanentUrl(platformData.imageUrl)) {
            existingImages.push(platformData.imageUrl)
          }
          for (const [, pData] of Object.entries(platformVersions)) {
            const pd = pData as Record<string, any>
            if (pd?.imageUrl && isPermanentUrl(pd.imageUrl) && !existingImages.includes(pd.imageUrl)) {
              existingImages.push(pd.imageUrl)
            }
          }

          const { renderId } = await createSocialVideo({
            script: platformData.videoScript,
            platform: videoPlatform,
            brandName: content.brand?.name || 'Brand',
            brandColor,
            brandLogoUrl,
            template: platformData.videoTemplate || 'product-showcase',
            ctaText: platformData.ctaText || 'Learn More',
            existingImageUrls: existingImages.length > 0 ? existingImages : undefined,
            skipVoiceover: true, // Use background music — saves ElevenLabs credits
          })

          await db.contentPost.update({
            where: { id: content.id },
            data: {
              platformVersions: {
                ...platformVersions,
                [videoPlatform]: {
                  ...platformData,
                  renderId,
                  videoEngine: 'shotstack',
                  videoStatus: 'processing',
                  videoAttempts: newAttempts,
                },
              },
            },
          })

          results.started++
          console.log(`[Video] Shotstack started: ${renderId}`)
        }
      } catch (error) {
        console.error(`[Video] Failed attempt ${newAttempts} for ${content.id}:`, error)

        // Save the attempt count and error so we don't retry endlessly
        await db.contentPost.update({
          where: { id: content.id },
          data: {
            platformVersions: {
              ...platformVersions,
              [videoPlatform]: {
                ...platformData,
                videoAttempts: newAttempts,
                videoStatus: newAttempts >= MAX_VIDEO_ATTEMPTS ? 'failed' : 'needs_creation',
                videoError: String(error).substring(0, 500),
              },
            },
          },
        })

        results.failed++
      }
    }

    // ──────────────────────────────────────────────
    // 2. POLL STATUS OF IN-PROGRESS VIDEOS
    // ──────────────────────────────────────────────

    const allVideoPosts = await db.contentPost.findMany({
      where: {
        platforms: { hasSome: VIDEO_PLATFORMS },
        brand: { isActive: true, deletedAt: null },
      },
    })

    const inProgress = allVideoPosts.filter(content => {
      const platformVersions = (content.platformVersions as Record<string, any>) || {}
      const videoPlatform = content.platforms.find(p => VIDEO_PLATFORMS.includes(p))
      if (!videoPlatform) return false
      return platformVersions[videoPlatform]?.videoStatus === 'processing'
    })

    for (const content of inProgress) {
      const platformVersions = (content.platformVersions as Record<string, any>) || {}
      const videoPlatform = content.platforms.find(p => VIDEO_PLATFORMS.includes(p))
      if (!videoPlatform) continue

      const platformData = platformVersions[videoPlatform]
      const engine = platformData?.videoEngine || 'shotstack'

      try {
        if (engine === 'heygen' && platformData?.heygenVideoId) {
          // ── Poll HeyGen ──
          const status = await getHeyGenStatus(platformData.heygenVideoId)

          if (status.status === 'completed') {
            await db.contentPost.update({
              where: { id: content.id },
              data: {
                platformVersions: {
                  ...platformVersions,
                  [videoPlatform]: {
                    ...platformData,
                    videoStatus: 'completed',
                    videoUrl: status.videoUrl,
                    thumbnailUrl: status.thumbnailUrl,
                  },
                },
              },
            })
            results.completed++
            console.log(`[Video] HeyGen completed: ${content.id} -> ${status.videoUrl}`)

          } else if (status.status === 'failed') {
            await db.contentPost.update({
              where: { id: content.id },
              data: {
                platformVersions: {
                  ...platformVersions,
                  [videoPlatform]: {
                    ...platformData,
                    videoStatus: 'failed',
                    videoError: status.error,
                  },
                },
              },
            })
            results.failed++
            console.log(`[Video] HeyGen failed: ${content.id} - ${status.error}`)

          } else {
            results.pending++
          }

        } else if (platformData?.renderId) {
          // ── Poll Shotstack ──
          const status = await checkVideoStatus(platformData.renderId)

          if (status.status === 'done') {
            await db.contentPost.update({
              where: { id: content.id },
              data: {
                platformVersions: {
                  ...platformVersions,
                  [videoPlatform]: {
                    ...platformData,
                    videoStatus: 'completed',
                    videoUrl: status.videoUrl,
                    thumbnailUrl: status.thumbnailUrl,
                  },
                },
              },
            })
            results.completed++
            console.log(`[Video] Shotstack completed: ${content.id} -> ${status.videoUrl}`)

          } else if (status.status === 'failed') {
            await db.contentPost.update({
              where: { id: content.id },
              data: {
                platformVersions: {
                  ...platformVersions,
                  [videoPlatform]: {
                    ...platformData,
                    videoStatus: 'failed',
                    videoError: status.error,
                  },
                },
              },
            })
            results.failed++
            console.log(`[Video] Shotstack failed: ${content.id} - ${status.error}`)

          } else {
            results.pending++
          }
        }
      } catch (error) {
        console.error(`[Video] Error checking status for ${content.id}:`, error)
      }
    }

    console.log('[Cron] Video processing complete:', results)

    return NextResponse.json({
      success: true,
      engines: { heygen: hasHeyGen, shotstack: hasShotstack },
      ...results,
    })
  } catch (error) {
    console.error('[Cron] Error in video processing:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
