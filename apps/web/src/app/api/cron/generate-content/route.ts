import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  generateSocialPost,
  generateEmail,
  generateSEOBlogPost,
  type BrandVoice,
} from '@/lib/ai/openai'
import { sendApprovalNotification } from '@/lib/email/client'

// Verify this is a legitimate Vercel Cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

// All supported social platforms including video
const ALL_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'threads', 'youtube', 'pinterest'] as const

// Split platforms into batches for smaller cron runs
const BATCH_1_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram'] as const
const BATCH_2_PLATFORMS = ['tiktok', 'threads', 'youtube', 'pinterest'] as const

// Generate book-specific topics from description
function generateBookTopics(book: { title: string; description: string | null; category: string | null }): string[] {
  const baseTopics = [
    `Key insights from "${book.title}"`,
    `Why readers love "${book.title}"`,
    `Lessons learned from "${book.title}"`,
    `Behind the scenes of "${book.title}"`,
    `How "${book.title}" can help you`,
    `Quotes and wisdom from "${book.title}"`,
    `Reader transformations from "${book.title}"`,
  ]
  return baseTopics
}

/**
 * GET /api/cron/generate-content
 *
 * Runs twice per week (Monday + Thursday at 12 PM EST / 5 PM UTC)
 * ?batch=1 (Monday): twitter, linkedin, facebook, instagram + blogs + email
 * ?batch=2 (Thursday): tiktok, threads, youtube, pinterest
 *
 * Each batch generates 3-4 days of content for smaller payloads
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get batch from query params (1 = Mon-Wed platforms, 2 = Thu-Sun platforms)
    const { searchParams } = new URL(request.url)
    const batch = searchParams.get('batch') || '1'
    const platforms = batch === '2' ? BATCH_2_PLATFORMS : BATCH_1_PLATFORMS
    const daysToGenerate = batch === '2' ? 3 : 4 // Thu-Sun = 4 days, Mon-Wed = 3 days
    const includeBlogsAndEmail = batch === '1' // Only generate blogs/email in batch 1

    console.log(`[Cron] Starting batch ${batch} content generation (${platforms.join(', ')})...`)

    // Get all active brands WITH their books
    const brands = await db.saaSBrand.findMany({
      where: { isActive: true },
      include: {
        organization: true,
        books: {
          where: { deletedAt: null, isActive: true },
        },
      },
    })

    if (brands.length === 0) {
      return NextResponse.json({ message: 'No active brands found', generated: 0 })
    }

    const results: Array<{
      brandId: string
      brandName: string
      bookId?: string
      bookTitle?: string
      contentCount: number
    }> = []

    for (const brand of brands) {
      const settings = (brand.settings as any) || {}
      const industry = settings.industry || 'technology'

      // Base brand voice
      const baseBrandVoice: BrandVoice = {
        personality: ['professional', 'helpful', 'trustworthy'],
        doSay: [],
        dontSay: [],
        valuePropositions: [],
        targetAudience: industry === 'church-management' || industry === 'education'
          ? 'Church administrators, pastors, ministry leaders, Christians seeking growth'
          : 'Professionals and organizations',
        industry: industry,
      }

      // If brand has books, generate content for EACH book
      if (brand.books.length > 0) {
        console.log(`[Cron] Brand "${brand.name}" has ${brand.books.length} book(s)`)

        for (const book of brand.books) {
          console.log(`[Cron] Generating content for book: "${book.title}"`)

          let contentCount = 0
          const bookTopics = generateBookTopics({
            title: book.title,
            description: book.description,
            category: book.category,
          })

          // Book-specific brand voice
          const bookBrandVoice: BrandVoice = {
            ...baseBrandVoice,
            valuePropositions: [
              book.title,
              book.description?.substring(0, 200) || '',
            ],
          }

          // Generate social posts for each platform (batch-specific days per book)
          for (const platform of platforms) {
            for (let day = 0; day < daysToGenerate; day++) {
              try {
                const scheduledDate = new Date()
                scheduledDate.setDate(scheduledDate.getDate() + day + 1)
                // Stagger times for different books
                const hourOffset = brand.books.indexOf(book) * 2
                scheduledDate.setHours(9 + hourOffset, 0, 0, 0)

                const topic = bookTopics[day % bookTopics.length]
                const result = await generateSocialPost(platform, topic, {
                  brandName: brand.name,
                  brandVoice: bookBrandVoice,
                  callToAction: book.amazonUrl ? `Get your copy: ${book.amazonUrl}` : undefined,
                })

                const isVideoPlatform = platform === 'tiktok' || platform === 'youtube'

                await db.contentPost.create({
                  data: {
                    brandId: brand.id,
                    title: `${platform} - ${book.title} - Day ${day + 1}`,
                    content: result.content,
                    platforms: [platform],
                    scheduledFor: scheduledDate,
                    aiGenerated: true,
                    aiPrompt: `Book: ${book.title} | Topic: ${topic}`,
                    aiModel: 'gpt-4o',
                    status: 'AWAITING_APPROVAL',
                    platformVersions: {
                      [platform]: {
                        content: result.content,
                        hashtags: result.hashtags,
                        mediaRecommendation: result.mediaRecommendation,
                        bookId: book.id,
                        bookTitle: book.title,
                        amazonUrl: book.amazonUrl,
                        ...(isVideoPlatform && {
                          isVideo: true,
                          videoScript: result.videoScript,
                          hook: result.hook,
                          estimatedDuration: result.estimatedDuration,
                          wordCount: result.wordCount,
                          suggestedBackground: result.suggestedBackground,
                          suggestedAvatar: result.suggestedAvatar,
                          videoStatus: 'needs_creation',
                        }),
                      },
                    },
                  },
                })

                contentCount++
              } catch (error) {
                console.error(`Error generating ${platform} for book "${book.title}":`, error)
              }
            }
          }

          // Generate blog posts only in batch 1
          if (includeBlogsAndEmail) {
          for (let i = 0; i < 2; i++) {
            try {
              const blogTopics = [
                `${book.title}: A Complete Guide`,
                `What You'll Learn from ${book.title}`,
              ]
              const topic = blogTopics[i]
              const targetKeyword = book.title.toLowerCase().replace(/[^a-z0-9\s]/g, '')

              const result = await generateSEOBlogPost(topic, {
                brandName: brand.name,
                brandVoice: bookBrandVoice,
                targetKeyword,
                secondaryKeywords: [book.author, book.category || 'book'].filter(Boolean) as string[],
              })

              const scheduledDate = new Date()
              scheduledDate.setDate(scheduledDate.getDate() + (i === 0 ? 2 : 5))
              scheduledDate.setHours(10 + brand.books.indexOf(book), 0, 0, 0)

              await db.contentPost.create({
                data: {
                  brandId: brand.id,
                  title: result.title,
                  content: result.content,
                  platforms: ['blog'],
                  scheduledFor: scheduledDate,
                  aiGenerated: true,
                  aiPrompt: `Book: ${book.title} | Blog about: ${topic}`,
                  aiModel: 'gpt-4o',
                  status: 'AWAITING_APPROVAL',
                  platformVersions: {
                    blog: {
                      title: result.title,
                      content: result.content,
                      metaTitle: result.metaTitle,
                      metaDescription: result.metaDescription,
                      slug: result.slug,
                      suggestedTags: result.suggestedTags,
                      seoScore: result.seoScore,
                      readingTime: result.readingTime,
                      wordCount: result.wordCount,
                      bookId: book.id,
                      bookTitle: book.title,
                      amazonUrl: book.amazonUrl,
                    },
                  },
                },
              })

              contentCount++
            } catch (error) {
              console.error(`Error generating blog for book "${book.title}":`, error)
            }
          }

          // Generate 1 book promo email
          try {
            const topic = `Discover "${book.title}" by ${book.author}`
            const result = await generateEmail('promotional', topic, {
              brandName: brand.name,
              brandVoice: bookBrandVoice,
              callToAction: book.amazonUrl ? `Get your copy now` : 'Learn more',
            })

            const scheduledDate = new Date()
            scheduledDate.setDate(scheduledDate.getDate() + 4)
            scheduledDate.setHours(8 + brand.books.indexOf(book), 0, 0, 0)

            await db.contentPost.create({
              data: {
                brandId: brand.id,
                title: `Email: ${book.title} Promo`,
                content: result.body,
                platforms: ['email'],
                scheduledFor: scheduledDate,
                aiGenerated: true,
                aiPrompt: `Book promo: ${book.title}`,
                aiModel: 'gpt-4o',
                status: 'AWAITING_APPROVAL',
                platformVersions: {
                  email: {
                    subject: result.subject,
                    previewText: result.previewText,
                    body: result.body,
                    callToAction: result.callToAction,
                    alternateSubjects: result.alternateSubjects,
                    bookId: book.id,
                    bookTitle: book.title,
                    amazonUrl: book.amazonUrl,
                  },
                },
              },
            })

            contentCount++
          } catch (error) {
            console.error(`Error generating email for book "${book.title}":`, error)
          }
          } // end includeBlogsAndEmail

          results.push({
            brandId: brand.id,
            brandName: brand.name,
            bookId: book.id,
            bookTitle: book.title,
            contentCount,
          })

          console.log(`[Cron] Generated ${contentCount} pieces for book "${book.title}"`)
        }
      } else {
        // Brand has no books - generate general brand content
        console.log(`[Cron] Brand "${brand.name}" has no books, generating brand content`)

        let contentCount = 0
        const description = settings.description || ''

        const topics = industry === 'church-management' || industry === 'education'
          ? ['ministry coordination', 'team productivity', 'church operations', 'volunteer management', 'event planning', 'leadership tips', 'stewardship']
          : ['professional development', 'leadership', 'productivity', 'growth strategies', 'best practices', 'industry insights', 'success stories']

        // Generate social posts (batch-specific days)
        console.log(`[Cron] Generating social posts for ${brand.name}...`)
        for (const platform of platforms) {
          for (let day = 0; day < daysToGenerate; day++) {
            try {
              console.log(`[Cron] Generating ${platform} day ${day + 1}...`)
              const scheduledDate = new Date()
              scheduledDate.setDate(scheduledDate.getDate() + day + 1)
              scheduledDate.setHours(9, 0, 0, 0)

              const topic = topics[day % topics.length]
              const result = await generateSocialPost(platform, topic, {
                brandName: brand.name,
                brandVoice: baseBrandVoice,
              })

              const isVideoPlatform = platform === 'tiktok' || platform === 'youtube'

              await db.contentPost.create({
                data: {
                  brandId: brand.id,
                  title: `${platform} post - ${topic}`,
                  content: result.content,
                  platforms: [platform],
                  scheduledFor: scheduledDate,
                  aiGenerated: true,
                  aiPrompt: topic,
                  aiModel: 'gpt-4o',
                  status: 'AWAITING_APPROVAL',
                  platformVersions: {
                    [platform]: {
                      content: result.content,
                      hashtags: result.hashtags,
                      mediaRecommendation: result.mediaRecommendation,
                      ...(isVideoPlatform && {
                        isVideo: true,
                        videoScript: result.videoScript,
                        hook: result.hook,
                        estimatedDuration: result.estimatedDuration,
                        wordCount: result.wordCount,
                        suggestedBackground: result.suggestedBackground,
                        suggestedAvatar: result.suggestedAvatar,
                        videoStatus: 'needs_creation',
                      }),
                    },
                  },
                },
              })

              contentCount++
            } catch (error) {
              console.log(`[Cron] ERROR generating ${platform} for ${brand.name}:`, String(error))
            }
          }
        }

        // Generate blog posts and email only in batch 1
        if (includeBlogsAndEmail) {
        // Generate 2 blog posts
        for (let i = 0; i < 2; i++) {
          try {
            const topic = topics[i % topics.length]
            const targetKeyword = `${industry === 'church-management' ? 'church' : ''} ${topic}`.trim()

            const result = await generateSEOBlogPost(topic, {
              brandName: brand.name,
              brandVoice: baseBrandVoice,
              targetKeyword,
              secondaryKeywords: [brand.name.toLowerCase(), industry],
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
                aiModel: 'gpt-4o',
                status: 'AWAITING_APPROVAL',
                platformVersions: {
                  blog: {
                    title: result.title,
                    content: result.content,
                    metaTitle: result.metaTitle,
                    metaDescription: result.metaDescription,
                    slug: result.slug,
                    suggestedTags: result.suggestedTags,
                    seoScore: result.seoScore,
                    readingTime: result.readingTime,
                    wordCount: result.wordCount,
                  },
                },
              },
            })

            contentCount++
          } catch (error) {
            console.error(`Error generating blog for ${brand.name}:`, error)
          }
        }

        // Generate 1 newsletter
        try {
          const topic = `Weekly update from ${brand.name}`
          const result = await generateEmail('newsletter', topic, {
            brandName: brand.name,
            brandVoice: baseBrandVoice,
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
              aiModel: 'gpt-4o',
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
        } // end includeBlogsAndEmail

        results.push({
          brandId: brand.id,
          brandName: brand.name,
          contentCount,
        })

        console.log(`[Cron] Generated ${contentCount} pieces for brand "${brand.name}"`)
      }
    }

    const totalContent = results.reduce((sum, r) => sum + r.contentCount, 0)
    console.log(`[Cron] Batch ${batch} content generation complete. Total: ${totalContent} pieces`)

    // Send email notifications to organization admins
    if (totalContent > 0) {
      const orgIds = [...new Set(brands.map(b => b.organizationId))]

      for (const orgId of orgIds) {
        try {
          // Find admins/owners to notify
          const members = await db.organizationMember.findMany({
            where: {
              organizationId: orgId,
              role: { in: ['OWNER', 'ADMIN'] },
            },
            include: { user: true },
          })

          // Get content items for this org
          const orgResults = results.filter(r =>
            brands.find(b => b.id === r.brandId)?.organizationId === orgId
          )
          const orgContentCount = orgResults.reduce((sum, r) => sum + r.contentCount, 0)

          if (orgContentCount > 0 && members.length > 0) {
            // Build approval items list
            const approvalItems = orgResults
              .filter(r => r.contentCount > 0)
              .map(r => ({
                title: r.bookTitle
                  ? `${r.contentCount} items for "${r.bookTitle}"`
                  : `${r.contentCount} items`,
                brandName: r.brandName,
                type: `Batch ${batch} - ${platforms.join(', ')}${includeBlogsAndEmail ? ', blogs, email' : ''}`,
              }))

            // Send to each admin
            for (const member of members) {
              if (member.user.email) {
                await sendApprovalNotification({
                  to: member.user.email,
                  userName: member.user.name || 'there',
                  pendingCount: orgContentCount,
                  approvalItems,
                })
                console.log(`[Cron] Notification sent to ${member.user.email}`)
              }
            }
          }
        } catch (error) {
          console.error(`[Cron] Error sending notification for org ${orgId}:`, error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch ${batch} content generated`,
      batch,
      platforms: Array.from(platforms),
      results,
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
