import { inngest } from '../client'
import { db } from '@/lib/db'
import {
  generateBlogPost,
  generateSocialPost,
  generateEmail,
  type BrandVoice,
} from '@/lib/ai/openai'

// Platforms to generate content for
const SOCIAL_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram'] as const

/**
 * Weekly Content Generation
 *
 * Runs every Sunday at 6 AM UTC
 * Generates a week's worth of content for all active brands:
 * - 7 social posts per platform (1 per day)
 * - 2 blog posts
 * - 1 email newsletter
 *
 * All content is created with AWAITING_APPROVAL status
 */
export const generateWeeklyContent = inngest.createFunction(
  {
    id: 'generate-weekly-content',
    name: 'Generate Weekly Content Calendar',
  },
  { cron: '0 6 * * 0' }, // Every Sunday at 6 AM UTC
  async ({ step }) => {
    // Step 1: Get all active brands
    const brands = await step.run('fetch-active-brands', async () => {
      return db.saaSBrand.findMany({
        where: {
          isActive: true,
        },
        include: {
          organization: true,
        },
      })
    })

    if (brands.length === 0) {
      return { message: 'No active brands found', generated: 0 }
    }

    const results: Array<{ brandId: string; brandName: string; contentCount: number }> = []

    // Step 2: Generate content for each brand
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

      // Generate social posts for each platform
      for (const platform of SOCIAL_PLATFORMS) {
        // Generate 7 posts (one for each day of the week)
        for (let day = 0; day < 7; day++) {
          const scheduledDate = new Date()
          scheduledDate.setDate(scheduledDate.getDate() + day + 1) // Start from Monday
          scheduledDate.setHours(9, 0, 0, 0) // 9 AM

          await step.run(`generate-${brand.slug}-${platform}-day-${day}`, async () => {
            try {
              // Generate topic based on brand goals
              const topics = brand.goals as string[] || ['product features', 'customer success', 'industry insights']
              const topic = topics[day % topics.length]

              const result = await generateSocialPost(platform, topic, {
                brandName: brand.name,
                brandVoice,
              })

              // Save to database as AWAITING_APPROVAL
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

              return { success: true }
            } catch (error) {
              console.error(`Error generating ${platform} content for ${brand.name}:`, error)
              return { success: false, error: String(error) }
            }
          })

          contentCount++
        }
      }

      // Generate 2 blog posts
      for (let i = 0; i < 2; i++) {
        await step.run(`generate-${brand.slug}-blog-${i}`, async () => {
          try {
            const topics = brand.goals as string[] || ['product guide', 'industry trends']
            const topic = topics[i % topics.length]

            const result = await generateBlogPost(topic, {
              brandName: brand.name,
              brandVoice,
            })

            const scheduledDate = new Date()
            scheduledDate.setDate(scheduledDate.getDate() + (i === 0 ? 2 : 5)) // Tuesday and Friday
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

            return { success: true }
          } catch (error) {
            console.error(`Error generating blog for ${brand.name}:`, error)
            return { success: false, error: String(error) }
          }
        })

        contentCount++
      }

      // Generate 1 email newsletter
      await step.run(`generate-${brand.slug}-email`, async () => {
        try {
          const topic = `Weekly update from ${brand.name}`

          const result = await generateEmail('newsletter', topic, {
            brandName: brand.name,
            brandVoice,
          })

          const scheduledDate = new Date()
          scheduledDate.setDate(scheduledDate.getDate() + 4) // Thursday
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

          return { success: true }
        } catch (error) {
          console.error(`Error generating email for ${brand.name}:`, error)
          return { success: false, error: String(error) }
        }
      })

      contentCount++

      results.push({
        brandId: brand.id,
        brandName: brand.name,
        contentCount,
      })
    }

    // Step 3: Create approval notification
    await step.run('create-approval-notifications', async () => {
      // Find organization owners to notify
      const orgIds = [...new Set(brands.map(b => b.organizationId))]

      for (const orgId of orgIds) {
        const members = await db.organizationMember.findMany({
          where: {
            organizationId: orgId,
            role: { in: ['OWNER', 'ADMIN'] },
          },
          include: { user: true },
        })

        // Create approval requests for each admin
        for (const member of members) {
          const pendingCount = await db.contentPost.count({
            where: {
              brand: { organizationId: orgId },
              status: 'AWAITING_APPROVAL',
            },
          })

          // In Phase 2, we'll send actual email notifications here
          console.log(`[Notification] ${member.user.email}: ${pendingCount} content items awaiting approval`)
        }
      }

      return { notified: true }
    })

    return {
      message: 'Weekly content generated successfully',
      brands: results,
      totalContent: results.reduce((sum, r) => sum + r.contentCount, 0),
    }
  }
)
