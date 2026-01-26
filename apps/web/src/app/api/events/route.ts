export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EventType, EventCategories, categorizeEvent } from '@/lib/analytics/event-processor'

// Mock event data for development
const generateMockEvents = (brandId: string, days: number = 30) => {
  const events = []
  const now = new Date()

  const channels = ['paid_search', 'organic_search', 'paid_social', 'direct', 'email', 'referral']
  const eventTypes = Object.values(EventType).filter(t => !t.startsWith('custom'))

  for (let d = 0; d < days; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)

    // Generate 50-200 events per day
    const eventCount = Math.floor(Math.random() * 150) + 50

    for (let i = 0; i < eventCount; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const channel = channels[Math.floor(Math.random() * channels.length)]

      events.push({
        id: `evt_${date.getTime()}_${i}`,
        brandId,
        eventType,
        channel,
        category: categorizeEvent(eventType),
        timestamp: new Date(date.getTime() + Math.random() * 86400000).toISOString(),
        sessionId: `sess_${Math.random().toString(36).substring(2, 9)}`,
        visitorId: `vis_${Math.random().toString(36).substring(2, 9)}`,
        revenue: eventType.includes('payment') || eventType.includes('subscription')
          ? Math.floor(Math.random() * 500) + 50
          : undefined,
        properties: {},
      })
    }
  }

  return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

/**
 * GET /api/events
 *
 * Query marketing events with filtering and pagination.
 *
 * Query params:
 * - brandId (required): Filter by brand
 * - eventType: Filter by event type
 * - channel: Filter by channel
 * - category: Filter by category (awareness, engagement, acquisition, etc.)
 * - startDate: Start of date range (ISO string)
 * - endDate: End of date range (ISO string)
 * - limit: Number of events (default 100, max 1000)
 * - offset: Pagination offset
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const eventType = searchParams.get('eventType')
    const channel = searchParams.get('channel')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 1000)
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: 'brandId is required' },
        { status: 400 }
      )
    }

    // In production: Query database with filters
    // For now, use mock data
    let events = generateMockEvents(brandId, 30)

    // Apply filters
    if (eventType) {
      events = events.filter(e => e.eventType === eventType)
    }
    if (channel) {
      events = events.filter(e => e.channel === channel)
    }
    if (category) {
      events = events.filter(e => e.category === category)
    }
    if (startDate) {
      const start = new Date(startDate)
      events = events.filter(e => new Date(e.timestamp) >= start)
    }
    if (endDate) {
      const end = new Date(endDate)
      events = events.filter(e => new Date(e.timestamp) <= end)
    }

    // Pagination
    const total = events.length
    const paginatedEvents = events.slice(offset, offset + limit)

    return NextResponse.json({
      success: true,
      data: {
        events: paginatedEvents,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to aggregate events for a brand.
 * Used internally - not a route export.
 */
function aggregateEvents(brandId: string, days: number = 30) {
  const events = generateMockEvents(brandId, days)

  // Aggregate by event type
  const byEventType: Record<string, number> = {}
  const byChannel: Record<string, number> = {}
  const byCategory: Record<string, number> = {}
  const byDay: Record<string, number> = {}

  let totalRevenue = 0

  for (const event of events) {
    byEventType[event.eventType] = (byEventType[event.eventType] || 0) + 1
    byChannel[event.channel] = (byChannel[event.channel] || 0) + 1
    byCategory[event.category] = (byCategory[event.category] || 0) + 1

    const day = event.timestamp.split('T')[0]
    byDay[day] = (byDay[day] || 0) + 1

    if (event.revenue) {
      totalRevenue += event.revenue
    }
  }

  return {
    totalEvents: events.length,
    totalRevenue,
    byEventType,
    byChannel,
    byCategory,
    byDay,
  }
}
