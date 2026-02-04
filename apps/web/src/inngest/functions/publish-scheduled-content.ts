import { inngest } from '../client'
import { db } from '@/lib/db'

/**
 * Publish Scheduled Content
 *
 * Runs every 15 minutes
 * Finds approved content scheduled for publishing and publishes it
 * to the connected social media platforms
 */
export const publishScheduledContent = inngest.createFunction(
  {
    id: 'publish-scheduled-content',
    name: 'Publish Scheduled Content',
  },
  { cron: '*/15 * * * *' }, // Every 15 minutes
  async ({ step }) => {
    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)

    // Step 1: Find content ready to publish
    const contentToPublish = await step.run('find-scheduled-content', async () => {
      return db.contentPost.findMany({
        where: {
          status: 'APPROVED',
          scheduledFor: {
            lte: fifteenMinutesFromNow,
            gte: now,
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
    })

    if (contentToPublish.length === 0) {
      return { message: 'No content scheduled for publishing', published: 0 }
    }

    const results: Array<{
      contentId: string
      platform: string
      status: 'published' | 'failed' | 'no_connection'
      error?: string
    }> = []

    // Step 2: Publish each piece of content
    for (const content of contentToPublish) {
      for (const platform of content.platforms) {
        await step.run(`publish-${content.id}-${platform}`, async () => {
          try {
            // Update status to PUBLISHING
            await db.contentPost.update({
              where: { id: content.id },
              data: { status: 'PUBLISHING' },
            })

            // Check for platform connection
            const connection = content.brand.adPlatformConnections.find(
              (c) => c.platform.toLowerCase().includes(platform.toLowerCase())
            )

            if (!connection || connection.status !== 'CONNECTED') {
              // No connection - mark as published anyway (for tracking)
              // In production, you'd want to handle this differently
              results.push({
                contentId: content.id,
                platform,
                status: 'no_connection',
              })

              // Still mark as published for demo purposes
              await db.contentPost.update({
                where: { id: content.id },
                data: {
                  status: 'PUBLISHED',
                  publishedAt: new Date(),
                  engagementMetrics: {
                    ...(content.engagementMetrics as object || {}),
                    [platform]: {
                      publishedAt: new Date().toISOString(),
                      status: 'no_connection',
                      note: 'Platform not connected - content marked as published for tracking',
                    },
                  },
                },
              })

              return { status: 'no_connection' }
            }

            // Platform-specific publishing logic
            // This is where we'll integrate actual social media APIs in Phase 3
            const platformVersions = content.platformVersions as Record<string, any> || {}
            const platformContent = platformVersions[platform] || { content: content.content }

            // TODO: Phase 3 - Implement actual publishing
            // For now, simulate successful publishing
            console.log(`[Publishing] ${platform}: ${platformContent.content?.substring(0, 100)}...`)

            // Update content as published
            await db.contentPost.update({
              where: { id: content.id },
              data: {
                status: 'PUBLISHED',
                publishedAt: new Date(),
                engagementMetrics: {
                  ...(content.engagementMetrics as object || {}),
                  [platform]: {
                    publishedAt: new Date().toISOString(),
                    status: 'published',
                    // These will be updated by a separate engagement tracking job
                    impressions: 0,
                    clicks: 0,
                    likes: 0,
                    shares: 0,
                    comments: 0,
                  },
                },
              },
            })

            results.push({
              contentId: content.id,
              platform,
              status: 'published',
            })

            return { status: 'published' }
          } catch (error) {
            console.error(`Error publishing ${content.id} to ${platform}:`, error)

            // Mark as failed
            await db.contentPost.update({
              where: { id: content.id },
              data: {
                status: 'FAILED',
                engagementMetrics: {
                  ...(content.engagementMetrics as object || {}),
                  [platform]: {
                    error: String(error),
                    failedAt: new Date().toISOString(),
                  },
                },
              },
            })

            results.push({
              contentId: content.id,
              platform,
              status: 'failed',
              error: String(error),
            })

            return { status: 'failed', error: String(error) }
          }
        })
      }
    }

    return {
      message: 'Content publishing completed',
      results,
      published: results.filter((r) => r.status === 'published').length,
      failed: results.filter((r) => r.status === 'failed').length,
      noConnection: results.filter((r) => r.status === 'no_connection').length,
    }
  }
)
