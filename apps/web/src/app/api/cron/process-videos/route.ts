import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createSocialVideo, checkVideoStatus } from '@/lib/video'

// Verify this is a legitimate Vercel Cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

const VIDEO_PLATFORMS = ['tiktok', 'youtube']

/**
 * GET /api/cron/process-videos
 *
 * Runs every 5 minutes (configured in vercel.json)
 * Processes video generation for TikTok and YouTube content:
 * 1. Generates images with DALL-E
 * 2. Creates voiceover with ElevenLabs
 * 3. Compiles video with Shotstack
 * 4. Updates content with completed video URLs
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Skip if Shotstack not configured
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
    const needsGeneration = await db.contentPost.findMany({
      where: {
        platforms: { hasSome: VIDEO_PLATFORMS },
        status: 'AWAITING_APPROVAL',
      },
      include: {
        brand: true,
      },
      take: 2, // Process max 2 at a time (video generation is expensive)
    })

    // Filter to only those without renderId
    const toGenerate = needsGeneration.filter(content => {
      const platformVersions = (content.platformVersions as Record<string, any>) || {}
      const videoPlatform = content.platforms.find(p => VIDEO_PLATFORMS.includes(p))
      if (!videoPlatform) return false
      const platformData = platformVersions[videoPlatform]
      return platformData?.videoScript && !platformData?.renderId
    })

    // Start video generation for each
    for (const content of toGenerate) {
      const platformVersions = (content.platformVersions as Record<string, any>) || {}
      const videoPlatform = content.platforms.find(p => VIDEO_PLATFORMS.includes(p)) as 'tiktok' | 'youtube'
      if (!videoPlatform) continue

      const platformData = platformVersions[videoPlatform]

      try {
        console.log(`[Video] Starting generation for ${content.id}...`)

        const { renderId } = await createSocialVideo({
          script: platformData.videoScript,
          platform: videoPlatform === 'youtube' ? 'youtube' : 'tiktok',
          brandName: content.brand?.name || 'Brand',
        })

        // Save renderId to track progress
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
      },
    })

    // Filter to those with processing status
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
          // Update with video URL
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
          // Mark as failed
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

    console.log(`[Cron] Video processing complete:`, results)

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
