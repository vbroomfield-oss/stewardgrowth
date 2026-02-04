import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Verify this is a legitimate Vercel Cron request
function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

/**
 * GET /api/cron/analyze-performance
 *
 * Runs every 6 hours (configured in vercel.json)
 * Analyzes brand performance and generates AI recommendations
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Starting performance analysis...')

    const brands = await db.saaSBrand.findMany({
      where: { isActive: true },
      include: {
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

    if (brands.length === 0) {
      return NextResponse.json({ message: 'No active brands', analyzed: 0 })
    }

    const results: Array<{
      brandId: string
      brandName: string
      recommendations: number
    }> = []

    for (const brand of brands) {
      const content = brand.contentPosts

      // Calculate metrics
      const totalImpressions = content.reduce((sum, c) => {
        const metrics = (c.engagementMetrics as Record<string, any>) || {}
        return sum + Object.values(metrics).reduce((s: number, m: any) => s + (m?.impressions || 0), 0)
      }, 0)

      const totalEngagement = content.reduce((sum, c) => {
        const metrics = (c.engagementMetrics as Record<string, any>) || {}
        return sum + Object.values(metrics).reduce(
          (s: number, m: any) => s + (m?.likes || 0) + (m?.shares || 0) + (m?.comments || 0),
          0
        )
      }, 0)

      const engagementRate = totalImpressions > 0 ? (totalEngagement / totalImpressions) * 100 : 0

      // Generate recommendations
      const recommendations: Array<{
        type: string
        title: string
        description: string
        priority: 'HIGH' | 'MEDIUM' | 'LOW'
        confidence: number
      }> = []

      if (engagementRate < 2 && content.length > 5) {
        recommendations.push({
          type: 'CONTENT_OPTIMIZATION',
          title: 'Low Engagement Rate',
          description: `Your engagement rate is ${engagementRate.toFixed(2)}%. Try different content formats or posting times.`,
          priority: 'HIGH',
          confidence: 85,
        })
      }

      const postsPerWeek = content.length / 4
      if (postsPerWeek < 7) {
        recommendations.push({
          type: 'POSTING_FREQUENCY',
          title: 'Increase Posting Frequency',
          description: `You're averaging ${postsPerWeek.toFixed(1)} posts/week. Aim for at least 7 for better visibility.`,
          priority: 'MEDIUM',
          confidence: 75,
        })
      }

      const platforms = new Set(content.flatMap((c) => c.platforms))
      if (platforms.size < 3) {
        recommendations.push({
          type: 'PLATFORM_EXPANSION',
          title: 'Expand to More Platforms',
          description: `You're only on ${platforms.size} platform(s). Consider adding LinkedIn, Twitter, or Facebook.`,
          priority: 'MEDIUM',
          confidence: 70,
        })
      }

      // Save recommendations
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
              contentCount: content.length,
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
          uniqueVisitors: Math.floor(totalImpressions * 0.7),
          leads: 0,
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
      })

      console.log(`[Cron] Analyzed ${brand.name}: ${recommendations.length} recommendations`)
    }

    console.log('[Cron] Performance analysis complete')

    return NextResponse.json({
      success: true,
      brands: results,
      totalRecommendations: results.reduce((sum, r) => sum + r.recommendations, 0),
    })
  } catch (error) {
    console.error('[Cron] Error in performance analysis:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
