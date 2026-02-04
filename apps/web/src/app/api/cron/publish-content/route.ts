import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createPublisher } from '@/lib/social/publisher'

// Verify this is a legitimate Vercel Cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

/**
 * GET /api/cron/publish-content
 *
 * Runs every 15 minutes (configured in vercel.json)
 * Publishes approved content that is scheduled
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Checking for content to publish...')

    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)

    // Find approved content scheduled for now
    const contentToPublish = await db.contentPost.findMany({
      where: {
        status: 'APPROVED',
        scheduledFor: {
          lte: fifteenMinutesFromNow,
          gte: new Date(now.getTime() - 60 * 60 * 1000), // Don't publish if more than 1 hour late
        },
      },
      include: {
        brand: {
          include: {
            adPlatformConnections: true,
          },
        },
      },
    })

    if (contentToPublish.length === 0) {
      return NextResponse.json({ message: 'No content to publish', published: 0 })
    }

    console.log(`[Cron] Found ${contentToPublish.length} items to publish`)

    const results: Array<{
      contentId: string
      platform: string
      status: 'published' | 'failed' | 'no_connection'
      error?: string
    }> = []

    for (const content of contentToPublish) {
      // Update to PUBLISHING status
      await db.contentPost.update({
        where: { id: content.id },
        data: { status: 'PUBLISHING' },
      })

      const publisher = createPublisher(content.brandId)

      for (const platform of content.platforms) {
        try {
          // Skip blog and email - those need different handling
          if (platform === 'blog' || platform === 'email') {
            results.push({
              contentId: content.id,
              platform,
              status: 'published',
            })
            continue
          }

          const platformVersions = (content.platformVersions as Record<string, any>) || {}
          const platformContent = platformVersions[platform] || { content: content.content }

          const result = await publisher.postTo(platform as any, {
            content: platformContent.content || content.content,
            hashtags: platformContent.hashtags,
          })

          if (result.success) {
            results.push({
              contentId: content.id,
              platform,
              status: 'published',
            })
          } else {
            results.push({
              contentId: content.id,
              platform,
              status: result.error?.includes('not connected') ? 'no_connection' : 'failed',
              error: result.error,
            })
          }
        } catch (error) {
          results.push({
            contentId: content.id,
            platform,
            status: 'failed',
            error: String(error),
          })
        }
      }

      // Update content status based on results
      const contentResults = results.filter((r) => r.contentId === content.id)
      const anySuccess = contentResults.some((r) => r.status === 'published')
      const allFailed = contentResults.every((r) => r.status === 'failed')

      await db.contentPost.update({
        where: { id: content.id },
        data: {
          status: allFailed ? 'FAILED' : 'PUBLISHED',
          publishedAt: anySuccess ? new Date() : null,
          engagementMetrics: Object.fromEntries(
            contentResults.map((r) => [
              r.platform,
              {
                status: r.status,
                publishedAt: r.status === 'published' ? new Date().toISOString() : null,
                error: r.error,
              },
            ])
          ),
        },
      })
    }

    const published = results.filter((r) => r.status === 'published').length
    const failed = results.filter((r) => r.status === 'failed').length

    console.log(`[Cron] Publishing complete. Published: ${published}, Failed: ${failed}`)

    return NextResponse.json({
      success: true,
      results,
      published,
      failed,
    })
  } catch (error) {
    console.error('[Cron] Error in content publishing:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
