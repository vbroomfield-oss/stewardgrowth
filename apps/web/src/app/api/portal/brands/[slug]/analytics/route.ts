export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// GET /api/portal/brands/[slug]/analytics - Get analytics for portal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

    // Get events for analytics
    const events = await db.marketingEvent.findMany({
      where: {
        brandId: brand.id,
        timestamp: { gte: startDate },
      },
      select: {
        eventName: true,
        utmSource: true,
        timestamp: true,
      },
      orderBy: { timestamp: 'desc' },
    })

    // Content stats over the period
    const contentStats = await db.contentPost.groupBy({
      by: ['status'],
      where: {
        brandId: brand.id,
        createdAt: { gte: startDate },
      },
      _count: true,
    })

    // Group events by day
    const eventsByDay: Record<string, number> = {}
    events.forEach(e => {
      const day = e.timestamp.toISOString().slice(0, 10)
      eventsByDay[day] = (eventsByDay[day] || 0) + 1
    })

    // Group events by type
    const eventsByType: Record<string, number> = {}
    events.forEach(e => {
      eventsByType[e.eventName] = (eventsByType[e.eventName] || 0) + 1
    })

    // Group by source
    const bySource: Record<string, number> = {}
    events.forEach(e => {
      if (e.utmSource) {
        bySource[e.utmSource] = (bySource[e.utmSource] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalEvents: events.length,
        eventsByDay: Object.entries(eventsByDay).map(([date, count]) => ({ date, count })),
        eventsByType: Object.entries(eventsByType).map(([type, count]) => ({ type, count })),
        topSources: Object.entries(bySource)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([source, count]) => ({ source, count })),
        contentStats: contentStats.map(s => ({ status: s.status, count: s._count })),
        range,
        startDate: startDate.toISOString(),
      },
    })
  } catch (error) {
    console.error('[Portal API] Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
