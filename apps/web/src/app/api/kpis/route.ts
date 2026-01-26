import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  calculateKPIs,
  generateKPISnapshot,
  calculateRecommendedBudget,
  ROLLUP_INTERVALS,
} from '@/lib/analytics/kpi-calculator'
import { type ProcessedEvent } from '@/lib/analytics/event-processor'

// Mock event generator for development
function generateMockEvents(brandId: string, days: number): ProcessedEvent[] {
  const events: ProcessedEvent[] = []
  const now = new Date()
  const channels = ['paid_search', 'organic_search', 'paid_social', 'direct', 'email']
  const eventTypes = [
    'page_view', 'lead_captured', 'trial_started', 'subscription_started',
    'ad_click', 'ad_impression', 'form_submit'
  ]

  for (let d = 0; d < days; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() - d)

    const dailyEvents = 100 + Math.floor(Math.random() * 200)

    for (let i = 0; i < dailyEvents; i++) {
      events.push({
        id: `evt_${date.getTime()}_${i}`,
        brandId,
        organizationId: 'org_demo',
        eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        channel: channels[Math.floor(Math.random() * channels.length)],
        timestamp: new Date(date.getTime() + Math.random() * 86400000),
        processedAt: new Date(),
        revenue: Math.random() > 0.95 ? Math.floor(Math.random() * 500) + 50 : undefined,
        currency: 'USD',
        visitorId: `vis_${Math.random().toString(36).substring(2, 9)}`,
        sessionId: `sess_${Math.random().toString(36).substring(2, 9)}`,
      })
    }
  }

  return events
}

/**
 * GET /api/kpis
 *
 * Get KPI snapshots for a brand.
 *
 * Query params:
 * - brandId (required): The brand to get KPIs for
 * - period: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly' (default: daily)
 * - compare: Whether to include comparison to previous period (default: true)
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
    const period = (searchParams.get('period') || 'daily') as 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly'
    const compare = searchParams.get('compare') !== 'false'

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: 'brandId is required' },
        { status: 400 }
      )
    }

    // Get mock data for development (in production, query database)
    const periodDays = {
      realtime: 1,
      hourly: 1,
      daily: 1,
      weekly: 7,
      monthly: 30,
    }

    const events = generateMockEvents(brandId, periodDays[period] * 2) // Double for comparison
    const mockAdSpend = 8500

    // Generate current period snapshot
    const currentSnapshot = await generateKPISnapshot(
      brandId,
      'org_demo',
      events.slice(0, Math.floor(events.length / 2)),
      period,
      mockAdSpend
    )

    // Generate previous period for comparison
    let previousSnapshot = null
    if (compare) {
      previousSnapshot = await generateKPISnapshot(
        brandId,
        'org_demo',
        events.slice(Math.floor(events.length / 2)),
        period,
        mockAdSpend * 0.9 // Slightly less spend in previous period
      )
    }

    // Calculate changes
    const changes: Record<string, number> = {}
    if (previousSnapshot) {
      const metrics = ['pageViews', 'uniqueVisitors', 'leads', 'totalRevenue', 'roas', 'cpa'] as const
      for (const metric of metrics) {
        const current = currentSnapshot.kpis[metric] as number
        const previous = previousSnapshot.kpis[metric] as number
        changes[metric] = previous > 0
          ? ((current - previous) / previous) * 100
          : 0
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        current: currentSnapshot,
        previous: previousSnapshot,
        changes,
        lastUpdated: new Date().toISOString(),
        nextUpdate: new Date(Date.now() + ROLLUP_INTERVALS.REALTIME).toISOString(),
      },
    })
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch KPIs' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to get budget recommendation.
 * Used internally - not a route export.
 */
async function getBudgetRecommendation(
  brandId: string,
  currentMRR: number,
  growthTarget: number = 20,
  industry: string = 'b2b_saas'
) {
  // In production: Get historical CPA from database
  const historicalCPA = 150

  return calculateRecommendedBudget(
    currentMRR,
    growthTarget,
    industry as 'b2b_saas' | 'church_software' | 'nonprofit_tech',
    historicalCPA
  )
}
