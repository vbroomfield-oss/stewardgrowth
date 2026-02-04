import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  generateSocialPost,
  generateEmail,
  generateSEOBlogPost,
  type BrandVoice,
} from '@/lib/ai/openai'

// Verify this is a legitimate Vercel Cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

// All supported social platforms including video
const SOCIAL_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram', 'tiktok', 'threads', 'youtube', 'pinterest'] as const

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
 * Runs every Sunday at 6 AM UTC (configured in vercel.json)
 * Generates a week's worth of content for:
 * - Each BOOK under each brand (separate content per book)
 * - Brands without books get general brand content
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Starting weekly content generation...')

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

          // Generate social posts for each platform (7 days per book)
          for (const platform of SOCIAL_PLATFORMS) {
            for (let day = 0; day < 7; day++) {
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
                    aiModel: 'gpt-4-turbo',
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

          // Generate 2 book-focused blog posts
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
                  aiModel: 'gpt-4-turbo',
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
                aiModel: 'gpt-4-turbo',
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

        // Generate social posts (7 days)
        for (const platform of SOCIAL_PLATFORMS) {
          for (let day = 0; day < 7; day++) {
            try {
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
                  aiModel: 'gpt-4-turbo',
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
              console.error(`Error generating ${platform} for ${brand.name}:`, error)
            }
          }
        }

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
                aiModel: 'gpt-4-turbo',
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

        console.log(`[Cron] Generated ${contentCount} pieces for brand "${brand.name}"`)
      }
    }

    const totalContent = results.reduce((sum, r) => sum + r.contentCount, 0)
    console.log(`[Cron] Weekly content generation complete. Total: ${totalContent} pieces`)

    return NextResponse.json({
      success: true,
      message: 'Weekly content generated',
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
