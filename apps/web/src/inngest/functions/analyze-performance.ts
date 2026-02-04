import { inngest } from '../client'
import { db } from '@/lib/db'

/**
 * Analyze Brand Performance
 *
 * Runs every 6 hours
 * Analyzes KPIs and generates AI recommendations for each brand
 */
export const analyzePerformance = inngest.createFunction(
  {
    id: 'analyze-brand-performance',
    name: 'Analyze Brand Performance',
  },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step }) => {
    // Step 1: Get all active brands
    const brands = await step.run('fetch-active-brands', async () => {
      return db.saaSBrand.findMany({
        where: { isActive: true },
        include: {
          kpiSnapshots: {
            orderBy: { date: 'desc' },
            take: 30, // Last 30 snapshots
          },
          contentPosts: {
            where: {
              status: 'PUBLISHED',
              publishedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      })
    })

    if (brands.length === 0) {
      return { message: 'No active brands to analyze', analyzed: 0 }
    }

    const results: Array<{
      brandId: string
      brandName: string
      recommendations: number
      alerts: number
    }> = []

    // Step 2: Analyze each brand
    for (const brand of brands) {
      await step.run(`analyze-${brand.slug}`, async () => {
        try {
          const kpis = brand.kpiSnapshots
          const content = brand.contentPosts

          // Calculate performance metrics
          const totalImpressions = content.reduce((sum, c) => {
            const metrics = c.engagementMetrics as Record<string, any> || {}
            return sum + Object.values(metrics).reduce((s, m: any) => s + (m?.impressions || 0), 0)
          }, 0)

          const totalEngagement = content.reduce((sum, c) => {
            const metrics = c.engagementMetrics as Record<string, any> || {}
            return sum + Object.values(metrics).reduce((s, m: any) =>
              s + (m?.likes || 0) + (m?.shares || 0) + (m?.comments || 0), 0
            )
          }, 0)

          const engagementRate = totalImpressions > 0
            ? (totalEngagement / totalImpressions) * 100
            : 0

          // Generate recommendations based on analysis
          const recommendations: Array<{
            type: string
            title: string
            description: string
            priority: 'HIGH' | 'MEDIUM' | 'LOW'
            confidence: number
          }> = []

          // Low engagement recommendation
          if (engagementRate < 2 && content.length > 5) {
            recommendations.push({
              type: 'CONTENT_OPTIMIZATION',
              title: 'Low Engagement Rate Detected',
              description: `Your content engagement rate is ${engagementRate.toFixed(2)}%. Consider testing different content formats, posting times, or topics to improve engagement.`,
              priority: 'HIGH',
              confidence: 85,
            })
          }

          // Posting frequency recommendation
          const postsPerWeek = content.length / 4 // Rough estimate
          if (postsPerWeek < 7) {
            recommendations.push({
              type: 'POSTING_FREQUENCY',
              title: 'Increase Posting Frequency',
              description: `You're averaging ${postsPerWeek.toFixed(1)} posts per week. Consider increasing to at least 7 posts per week for better visibility.`,
              priority: 'MEDIUM',
              confidence: 75,
            })
          }

          // Platform diversification
          const platforms = new Set(content.flatMap(c => c.platforms))
          if (platforms.size < 3) {
            recommendations.push({
              type: 'PLATFORM_EXPANSION',
              title: 'Expand to More Platforms',
              description: `You're only active on ${platforms.size} platform(s). Consider expanding to LinkedIn, Twitter, and Facebook for wider reach.`,
              priority: 'MEDIUM',
              confidence: 70,
            })
          }

          // Save recommendations to database
          for (const rec of recommendations) {
            await db.aIRecommendation.create({
              data: {
                brandId: brand.id,
                type: rec.type as any,
                title: rec.title,
                description: rec.description,
                confidence: rec.confidence,
                urgency: rec.priority,
                status: 'PENDING',
                data: {
                  engagementRate,
                  totalImpressions,
                  totalEngagement,
                  contentCount: content.length,
                  platforms: Array.from(platforms),
                },
              },
            })
          }

          // Create KPI snapshot
          await db.kPISnapshot.create({
            data: {
              brandId: brand.id,
              date: new Date(),
              period: 'DAILY',
              pageViews: totalImpressions,
              uniqueVisitors: Math.floor(totalImpressions * 0.7), // Estimate
              leads: 0, // Would come from event tracking
              conversions: 0,
              revenue: 0,
              adSpend: 0,
              organicTraffic: totalImpressions,
              paidTraffic: 0,
              socialTraffic: totalImpressions,
              emailTraffic: 0,
              directTraffic: 0,
              referralTraffic: 0,
            },
          })

          results.push({
            brandId: brand.id,
            brandName: brand.name,
            recommendations: recommendations.length,
            alerts: recommendations.filter(r => r.priority === 'HIGH').length,
          })

          return { success: true, recommendations: recommendations.length }
        } catch (error) {
          console.error(`Error analyzing ${brand.name}:`, error)
          return { success: false, error: String(error) }
        }
      })
    }

    return {
      message: 'Performance analysis completed',
      brands: results,
      totalRecommendations: results.reduce((sum, r) => sum + r.recommendations, 0),
      totalAlerts: results.reduce((sum, r) => sum + r.alerts, 0),
    }
  }
)
