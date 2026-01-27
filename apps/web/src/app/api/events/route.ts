export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

// GET /api/events - Get events for the user's organization
export async function GET(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 500)

    // Get all brands for this organization
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
        ...(brandId ? { id: brandId } : {}),
      },
      select: { id: true, name: true },
    })

    const brandIds = brands.map(b => b.id)
    const brandMap = new Map(brands.map(b => [b.id, b.name]))

    if (brandIds.length === 0) {
      return NextResponse.json({
        success: true,
        events: [],
        summary: [],
        total: 0,
      })
    }

    // Get recent events
    const recentEvents = await db.event.findMany({
      where: {
        brandId: { in: brandIds },
      },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        visitorId: true,
        userId: true,
        brandId: true,
        timestamp: true,
        properties: true,
        url: true,
      },
    })

    // Get event counts by type
    const eventCounts = await db.event.groupBy({
      by: ['eventType'],
      where: {
        brandId: { in: brandIds },
      },
      _count: {
        eventType: true,
      },
    })

    // Transform events for response
    const transformedEvents = recentEvents.map(event => ({
      id: event.id,
      event: event.eventType,
      user: event.userId || event.visitorId || 'anonymous',
      brand: brandMap.get(event.brandId) || 'Unknown',
      brandId: event.brandId,
      time: getRelativeTime(event.timestamp),
      timestamp: event.timestamp.toISOString(),
      properties: event.properties || {},
      url: event.url,
    }))

    // Transform summary
    const summary = eventCounts.map(ec => ({
      name: ec.eventType,
      count: ec._count.eventType,
      change: 0, // Would need historical data to calculate
    }))

    // Get total count
    const totalCount = await db.event.count({
      where: {
        brandId: { in: brandIds },
      },
    })

    return NextResponse.json({
      success: true,
      events: transformedEvents,
      summary,
      total: totalCount,
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return 'just now'
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHours < 24) return `${diffHours} hr ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return date.toLocaleDateString()
}
