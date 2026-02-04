import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  generateBlogPost,
  generateSocialPost,
  generateEmail,
  type BrandVoice,
} from '@/lib/ai/openai'

// Verify this is a legitimate Vercel Cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  // Vercel sends CRON_SECRET in production
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  // In development, allow all requests
  return process.env.NODE_ENV === 'development'
}

const SOCIAL_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram'] as const

/**
 * GET /api/cron/generate-content
 *
 * Runs every Sunday at 6 AM UTC (configured in vercel.json)
 * Generates a week's worth of content for all active brands
 */
export async function GET(request: NextRequest) {
  // Verify request is from Vercel Cron
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Starting weekly content generation...')

    // Get all active brands
    const brands = await db.saaSBrand.findMany({
      where: { isActive: true },
      include: { organization: true },
    })

    if (brands.length === 0) {
      return NextResponse.json({ message: 'No active brands found', generated: 0 })
    }

    const results: Array<{ brandId: string; brandName: string; contentCount: number }> = []

    for (const brand of brands) {
      const brandVoice: BrandVoice = {
        personality: (brand.brandVoice as any)?.personality || ['professional', 'helpful'],
        doSay: (brand.brandVoice as any)?.doSay || [],
        dontSay: (brand.brandVoice as any)?.dontSay || [],
        valuePropositions: (brand.brandVoice as any)?.valuePropositions || [],
        targetAudience: (brand.targetAudiences as string[])?.join(', ') || 'general audience',
        industry: brand.industry || 'technology',
      }

      let contentCount = 0
      const topics = (brand.goals as string[]) || ['product features', 'customer success', 'industry insights']

      // Generate social posts for each platform (7 days)
      for (const platform of SOCIAL_PLATFORMS) {
        for (let day = 0; day < 7; day++) {
          try {
            const scheduledDate = new Date()
            scheduledDate.setDate(scheduledDate.getDate() + day + 1)
            scheduledDate.setHours(9, 0, 0, 0)

            const topic = topics[day % topics.length]
            const result = await generateSocialPost(platform, topic, {
              brandName: brand.name,
              brandVoice,
            })

            await db.contentPost.create({
              data: {
                brandId: brand.id,
                title: `${platform} post - ${topic}`,
                content: result.content,
                platforms: [platform],
                scheduledFor: scheduledDate,
                aiGenerated: true,
                aiPrompt: topic,
                aiModel: 'gpt-4-turbo',
                status: 'AWAITING_APPROVAL',
                platformVersions: {
                  [platform]: {
                    content: result.content,
                    hashtags: result.hashtags,
                    mediaRecommendation: result.mediaRecommendation,
                  },
                },
              },
            })

            contentCount++
          } catch (error) {
            console.error(`Error generating ${platform} content for ${brand.name}:`, error)
          }
        }
      }

      // Generate 2 blog posts
      for (let i = 0; i < 2; i++) {
        try {
          const topic = topics[i % topics.length]
          const result = await generateBlogPost(topic, {
            brandName: brand.name,
            brandVoice,
          })

          const scheduledDate = new Date()
          scheduledDate.setDate(scheduledDate.getDate() + (i === 0 ? 2 : 5))
          scheduledDate.setHours(10, 0, 0, 0)

          await db.contentPost.create({
            data: {
              brandId: brand.id,
              title: result.title,
              content: result.content,
              platforms: ['blog'],
              scheduledFor: scheduledDate,
              aiGenerated: true,
              aiPrompt: topic,
              aiModel: 'gpt-4-turbo',
              status: 'AWAITING_APPROVAL',
              platformVersions: {
                blog: {
                  title: result.title,
                  content: result.content,
                  metaDescription: result.metaDescription,
                  suggestedTags: result.suggestedTags,
                },
              },
            },
          })

          contentCount++
        } catch (error) {
          console.error(`Error generating blog for ${brand.name}:`, error)
        }
      }

      // Generate 1 email newsletter
      try {
        const topic = `Weekly update from ${brand.name}`
        const result = await generateEmail('newsletter', topic, {
          brandName: brand.name,
          brandVoice,
        })

        const scheduledDate = new Date()
        scheduledDate.setDate(scheduledDate.getDate() + 4)
        scheduledDate.setHours(8, 0, 0, 0)

        await db.contentPost.create({
          data: {
            brandId: brand.id,
            title: result.subject,
            content: result.body,
            platforms: ['email'],
            scheduledFor: scheduledDate,
            aiGenerated: true,
            aiPrompt: topic,
            aiModel: 'gpt-4-turbo',
            status: 'AWAITING_APPROVAL',
            platformVersions: {
              email: {
                subject: result.subject,
                previewText: result.previewText,
                body: result.body,
                callToAction: result.callToAction,
                alternateSubjects: result.alternateSubjects,
              },
            },
          },
        })

        contentCount++
      } catch (error) {
        console.error(`Error generating email for ${brand.name}:`, error)
      }

      results.push({
        brandId: brand.id,
        brandName: brand.name,
        contentCount,
      })

      console.log(`[Cron] Generated ${contentCount} pieces for ${brand.name}`)
    }

    const totalContent = results.reduce((sum, r) => sum + r.contentCount, 0)
    console.log(`[Cron] Weekly content generation complete. Total: ${totalContent} pieces`)

    return NextResponse.json({
      success: true,
      message: 'Weekly content generated',
      brands: results,
      totalContent,
    })
  } catch (error) {
    console.error('[Cron] Error in content generation:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
