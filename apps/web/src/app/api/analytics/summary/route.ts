export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

function getDateRange(range: string): Date {
  const now = new Date()
  switch (range) {
    case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '12m': return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    default: return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  }
}

export async function GET(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandSlug = searchParams.get('brandId')
    const range = searchParams.get('range') || '30d'
    const startDate = getDateRange(range)

    // Get brands for this org
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
        ...(brandSlug && brandSlug !== 'all' ? { slug: brandSlug } : {}),
      },
      select: { id: true, name: true, slug: true },
    })

    const brandIds = brands.map(b => b.id)

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          pageViews: 0, uniqueVisitors: 0, leads: 0, conversions: 0,
          revenue: 0, adSpend: 0, roas: 0, ctr: 0, cpa: 0,
          sessions: 0, trials: 0,
          eventsByDay: [], topPages: [], topSources: [],
          funnelData: [
            { name: 'Page Views', value: 0 },
            { name: 'Engaged Visitors', value: 0 },
            { name: 'Leads Captured', value: 0 },
            { name: 'Qualified Leads', value: 0 },
            { name: 'Trial Started', value: 0 },
            { name: 'Converted', value: 0 },
          ],
        },
      })
    }

    // Run all queries in parallel
    const [
      pageViewCount,
      uniqueVisitorCount,
      sessionCount,
      leadCount,
      trialCount,
      conversionCount,
      revenueData,
      eventsByDayRaw,
      topPagesRaw,
      topSourcesRaw,
    ] = await Promise.all([
      // Page views
      db.marketingEvent.count({
        where: { brandId: { in: brandIds }, eventName: 'PAGE_VIEW', timestamp: { gte: startDate } },
      }),
      // Unique visitors (by anonymousId)
      db.marketingEvent.groupBy({
        by: ['anonymousId'],
        where: { brandId: { in: brandIds }, anonymousId: { not: null }, timestamp: { gte: startDate } },
      }).then(r => r.length),
      // Sessions
      db.marketingEvent.count({
        where: { brandId: { in: brandIds }, eventName: 'SESSION_START', timestamp: { gte: startDate } },
      }),
      // Leads
      db.marketingEvent.count({
        where: { brandId: { in: brandIds }, eventName: { in: ['LEAD_CAPTURED', 'FORM_SUBMITTED', 'DEMO_REQUESTED'] }, timestamp: { gte: startDate } },
      }),
      // Trials
      db.marketingEvent.count({
        where: { brandId: { in: brandIds }, eventName: 'TRIAL_STARTED', timestamp: { gte: startDate } },
      }),
      // Conversions
      db.marketingEvent.count({
        where: { brandId: { in: brandIds }, eventName: { in: ['SUBSCRIPTION_STARTED', 'PAYMENT_SUCCEEDED'] }, timestamp: { gte: startDate } },
      }),
      // Revenue
      db.marketingEvent.aggregate({
        where: { brandId: { in: brandIds }, eventName: { in: ['PAYMENT_SUCCEEDED', 'SUBSCRIPTION_STARTED'] }, timestamp: { gte: startDate }, revenue: { not: null } },
        _sum: { revenue: true },
      }),
      // Events by day
      db.$queryRaw`
        SELECT DATE("timestamp") as date, COUNT(*)::int as count
        FROM "MarketingEvent"
        WHERE "brandId" = ANY(${brandIds}::text[])
        AND "timestamp" >= ${startDate}
        GROUP BY DATE("timestamp")
        ORDER BY date ASC
      `.catch(() => []),
      // Top pages
      db.marketingEvent.groupBy({
        by: ['landingPage'],
        where: { brandId: { in: brandIds }, eventName: 'PAGE_VIEW', landingPage: { not: null }, timestamp: { gte: startDate } },
        _count: { landingPage: true },
        orderBy: { _count: { landingPage: 'desc' } },
        take: 10,
      }),
      // Top sources
      db.marketingEvent.groupBy({
        by: ['utmSource'],
        where: { brandId: { in: brandIds }, utmSource: { not: null }, timestamp: { gte: startDate } },
        _count: { utmSource: true },
        orderBy: { _count: { utmSource: 'desc' } },
        take: 10,
      }),
    ])

    const revenue = Number(revenueData._sum.revenue || 0)

    // Build funnel data
    const engagedVisitors = await db.marketingEvent.groupBy({
      by: ['anonymousId'],
      where: {
        brandId: { in: brandIds },
        timestamp: { gte: startDate },
        anonymousId: { not: null },
      },
      having: { anonymousId: { _count: { gt: 1 } } },
    }).then(r => r.length).catch(() => 0)

    const funnelData = [
      { name: 'Page Views', value: pageViewCount },
      { name: 'Engaged Visitors', value: engagedVisitors },
      { name: 'Leads Captured', value: leadCount },
      { name: 'Qualified Leads', value: Math.floor(leadCount * 0.6) }, // Estimate until proper qualification tracking
      { name: 'Trial Started', value: trialCount },
      { name: 'Converted', value: conversionCount },
    ]

    return NextResponse.json({
      success: true,
      data: {
        pageViews: pageViewCount,
        uniqueVisitors: uniqueVisitorCount,
        sessions: sessionCount,
        leads: leadCount,
        trials: trialCount,
        conversions: conversionCount,
        revenue,
        adSpend: 0, // Requires ad platform integration
        roas: 0,
        ctr: 0,
        cpa: leadCount > 0 ? 0 : 0, // Requires ad spend data
        eventsByDay: (eventsByDayRaw as any[]).map((row: any) => ({
          date: row.date,
          count: row.count,
        })),
        topPages: topPagesRaw.map(p => ({
          page: p.landingPage,
          views: p._count.landingPage,
        })),
        topSources: topSourcesRaw.map(s => ({
          source: s.utmSource,
          count: s._count.utmSource,
        })),
        funnelData,
      },
    })
  } catch (error) {
    console.error('Error fetching analytics summary:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
