import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSocialVideo, checkVideoStatus } from '@/lib/video'

function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

const VIDEO_PLATFORMS = ['tiktok', 'youtube', 'facebook', 'instagram']

/**
 * GET /api/cron/process-videos
 *
 * Runs every 5 minutes (configured in vercel.json)
 * Processes ecommerce-style video generation for social content:
 * 1. Generates product/lifestyle images with DALL-E
 * 2. Generates ad copy (headlines + subtexts)
 * 3. Creates voiceover with ElevenLabs
 * 4. Compiles professional ad video with Shotstack
 * 5. Updates content with completed video URLs
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.SHOTSTACK_API_KEY) {
    return NextResponse.json({
      message: 'Shotstack not configured, skipping video processing',
      skipped: true,
    })
  }

  try {
    console.log('[Cron] Processing videos...')

    const results = {
      started: 0,
      completed: 0,
      failed: 0,
      pending: 0,
    }

    // 1. Find content that needs video generation (has video script but no render ID)
    // Fetch more than we need since we filter client-side for videoScript presence
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
      return platformData?.videoScript && !platformData?.renderId
    }).slice(0, 1) // Process 1 at a time to stay within 300s timeout

    console.log(`[Video] ${toGenerate.length} posts need video generation`)

    for (const content of toGenerate) {
      const platformVersions = (content.platformVersions as Record<string, any>) || {}
      const videoPlatform = content.platforms.find(p => VIDEO_PLATFORMS.includes(p)) as 'tiktok' | 'youtube' | 'facebook' | 'instagram'
      if (!videoPlatform) continue

      const platformData = platformVersions[videoPlatform]

      try {
        console.log(`[Video] Starting generation for ${content.id} (${videoPlatform})...`)

        // Extract brand styling for professional ad look
        const brandSettings = (content.brand?.settings as Record<string, any>) || {}
        const brandColor = (brandSettings.color as string) || '#1a1a2e'
        const brandLogoUrl = brandSettings.logoUrl || content.brand?.logo || undefined

        // Collect existing images from content post to avoid regenerating with DALL-E
        const existingImages: string[] = []
        if (platformData.imageUrl) existingImages.push(platformData.imageUrl)
        // Also check other platform versions for images
        for (const [, pData] of Object.entries(platformVersions)) {
          const pd = pData as Record<string, any>
          if (pd?.imageUrl && !existingImages.includes(pd.imageUrl)) {
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
          // Use existing images if available to skip slow DALL-E generation
          existingImageUrls: existingImages.length > 0 ? existingImages : undefined,
        })

        await db.contentPost.update({
          where: { id: content.id },
          data: {
            platformVersions: {
              ...platformVersions,
              [videoPlatform]: {
                ...platformData,
                renderId,
                videoStatus: 'processing',
              },
            },
          },
        })

        results.started++
        console.log(`[Video] Started generation: ${renderId}`)
      } catch (error) {
        console.error(`[Video] Failed to start generation for ${content.id}:`, error)
        results.failed++
      }
    }

    // 2. Check status of in-progress videos
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
      if (!platformData?.renderId) continue

      try {
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
          console.log(`[Video] Completed: ${content.id} -> ${status.videoUrl}`)
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
          console.log(`[Video] Failed: ${content.id} - ${status.error}`)
        } else {
          results.pending++
        }
      } catch (error) {
        console.error(`[Video] Error checking status for ${content.id}:`, error)
      }
    }

    console.log('[Cron] Video processing complete:', results)

    return NextResponse.json({
      success: true,
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
