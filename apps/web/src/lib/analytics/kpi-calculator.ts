/**
 * KPI Calculator
 *
 * Calculates and rolls up marketing KPIs at configurable intervals.
 * Default rollup: every 30 minutes, with daily/weekly/monthly aggregations.
 */

import { EventType, categorizeEvent, getConversionValue, type ProcessedEvent } from './event-processor'

// Rollup intervals
export const ROLLUP_INTERVALS = {
  REALTIME: 30 * 60 * 1000, // 30 minutes (as requested)
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
} as const

// Core marketing KPIs
export interface MarketingKPIs {
  // Traffic
  pageViews: number
  uniqueVisitors: number
  sessions: number
  avgSessionDuration: number
  bounceRate: number

  // Engagement
  engagementRate: number
  scrollDepth: number
  videoCompletionRate: number

  // Acquisition
  leads: number
  qualifiedLeads: number
  leadConversionRate: number
  costPerLead: number

  // Trial/Signup
  trials: number
  trialActivationRate: number
  trialConversionRate: number

  // Revenue
  newMRR: number
  totalRevenue: number
  avgDealSize: number
  revenuePerVisitor: number

  // Advertising
  adSpend: number
  impressions: number
  clicks: number
  ctr: number // Click-through rate
  cpc: number // Cost per click
  cpa: number // Cost per acquisition
  roas: number // Return on ad spend

  // Channel Performance
  channelBreakdown: Record<string, ChannelMetrics>
}

export interface ChannelMetrics {
  visitors: number
  leads: number
  conversions: number
  revenue: number
  spend: number
  cpa: number
  roas: number
}

export interface KPISnapshot {
  brandId: string
  organizationId: string
  period: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly'
  startTime: Date
  endTime: Date
  kpis: MarketingKPIs
  calculatedAt: Date
}

/**
 * Calculate KPIs from a set of events
 */
export function calculateKPIs(
  events: ProcessedEvent[],
  adSpend: number = 0
): MarketingKPIs {
  const uniqueVisitors = new Set(events.filter(e => e.visitorId).map(e => e.visitorId)).size
  const uniqueSessions = new Set(events.filter(e => e.sessionId).map(e => e.sessionId)).size

  // Count by event type
  const counts = events.reduce((acc, event) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Revenue calculation
  const revenueEvents = events.filter(e =>
    e.eventType === EventType.PAYMENT_COMPLETED ||
    e.eventType === EventType.SUBSCRIPTION_STARTED
  )
  const totalRevenue = revenueEvents.reduce((sum, e) => sum + (e.revenue || 0), 0)

  // Lead counts
  const leads = counts[EventType.LEAD_CAPTURED] || 0
  const qualifiedLeads = counts[EventType.LEAD_QUALIFIED] || 0

  // Trial counts
  const trials = counts[EventType.TRIAL_STARTED] || 0
  const trialActivations = counts[EventType.TRIAL_ACTIVATED] || 0
  const trialConversions = counts[EventType.TRIAL_CONVERTED] || 0

  // Ad metrics
  const impressions = counts[EventType.AD_IMPRESSION] || 0
  const clicks = counts[EventType.AD_CLICK] || 0
  const adConversions = counts[EventType.AD_CONVERSION] || 0

  // Page views
  const pageViews = counts[EventType.PAGE_VIEW] || 0

  // Engagement metrics
  const scrollEvents = events.filter(e => e.eventType === EventType.SCROLL_DEPTH)
  const avgScrollDepth = scrollEvents.length > 0
    ? scrollEvents.reduce((sum, e) => sum + (Number(e.properties?.depth) || 0), 0) / scrollEvents.length
    : 0

  const videoPlays = counts[EventType.VIDEO_PLAY] || 0
  const videoCompletes = counts[EventType.VIDEO_COMPLETE] || 0

  // Channel breakdown
  const channelBreakdown = calculateChannelMetrics(events, adSpend)

  return {
    // Traffic
    pageViews,
    uniqueVisitors,
    sessions: uniqueSessions,
    avgSessionDuration: 0, // Requires session tracking
    bounceRate: 0, // Requires session analysis

    // Engagement
    engagementRate: uniqueVisitors > 0
      ? (events.filter(e => categorizeEvent(e.eventType) === 'engagement').length / uniqueVisitors) * 100
      : 0,
    scrollDepth: avgScrollDepth,
    videoCompletionRate: videoPlays > 0 ? (videoCompletes / videoPlays) * 100 : 0,

    // Acquisition
    leads,
    qualifiedLeads,
    leadConversionRate: pageViews > 0 ? (leads / pageViews) * 100 : 0,
    costPerLead: leads > 0 ? adSpend / leads : 0,

    // Trial/Signup
    trials,
    trialActivationRate: trials > 0 ? (trialActivations / trials) * 100 : 0,
    trialConversionRate: trials > 0 ? (trialConversions / trials) * 100 : 0,

    // Revenue
    newMRR: totalRevenue, // Simplified - would need subscription tracking
    totalRevenue,
    avgDealSize: revenueEvents.length > 0 ? totalRevenue / revenueEvents.length : 0,
    revenuePerVisitor: uniqueVisitors > 0 ? totalRevenue / uniqueVisitors : 0,

    // Advertising
    adSpend,
    impressions,
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? adSpend / clicks : 0,
    cpa: adConversions > 0 ? adSpend / adConversions : 0,
    roas: adSpend > 0 ? totalRevenue / adSpend : 0,

    // Channel breakdown
    channelBreakdown,
  }
}

/**
 * Calculate metrics broken down by channel
 */
function calculateChannelMetrics(
  events: ProcessedEvent[],
  totalAdSpend: number
): Record<string, ChannelMetrics> {
  const channels: Record<string, ProcessedEvent[]> = {}

  // Group events by channel
  for (const event of events) {
    const channel = event.channel || 'unknown'
    if (!channels[channel]) {
      channels[channel] = []
    }
    channels[channel].push(event)
  }

  // Calculate metrics for each channel
  const result: Record<string, ChannelMetrics> = {}

  for (const [channel, channelEvents] of Object.entries(channels)) {
    const visitors = new Set(channelEvents.map(e => e.visitorId).filter(Boolean)).size
    const leads = channelEvents.filter(e => e.eventType === EventType.LEAD_CAPTURED).length
    const conversions = channelEvents.filter(e =>
      e.eventType === EventType.SUBSCRIPTION_STARTED ||
      e.eventType === EventType.TRIAL_CONVERTED
    ).length
    const revenue = channelEvents
      .filter(e => e.revenue)
      .reduce((sum, e) => sum + (e.revenue || 0), 0)

    // Estimate channel spend (would come from ad platform data in production)
    const isPaidChannel = channel.includes('paid')
    const spend = isPaidChannel
      ? (channelEvents.length / events.length) * totalAdSpend
      : 0

    result[channel] = {
      visitors,
      leads,
      conversions,
      revenue,
      spend,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? revenue / spend : 0,
    }
  }

  return result
}

/**
 * Generate KPI snapshot for a time period
 */
export async function generateKPISnapshot(
  brandId: string,
  organizationId: string,
  events: ProcessedEvent[],
  period: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'monthly',
  adSpend: number = 0
): Promise<KPISnapshot> {
  const now = new Date()
  let startTime: Date

  switch (period) {
    case 'realtime':
      startTime = new Date(now.getTime() - ROLLUP_INTERVALS.REALTIME)
      break
    case 'hourly':
      startTime = new Date(now.getTime() - ROLLUP_INTERVALS.HOURLY)
      break
    case 'daily':
      startTime = new Date(now.getTime() - ROLLUP_INTERVALS.DAILY)
      break
    case 'weekly':
      startTime = new Date(now.getTime() - ROLLUP_INTERVALS.WEEKLY)
      break
    case 'monthly':
      startTime = new Date(now.getTime() - ROLLUP_INTERVALS.MONTHLY)
      break
  }

  // Filter events to period
  const periodEvents = events.filter(e =>
    new Date(e.timestamp) >= startTime && new Date(e.timestamp) <= now
  )

  const kpis = calculateKPIs(periodEvents, adSpend)

  return {
    brandId,
    organizationId,
    period,
    startTime,
    endTime: now,
    kpis,
    calculatedAt: now,
  }
}

/**
 * Compare KPIs between two periods (for trend calculation)
 */
export function compareKPIs(
  current: MarketingKPIs,
  previous: MarketingKPIs
): Record<string, { value: number; change: number; changePercent: number }> {
  const metrics: (keyof MarketingKPIs)[] = [
    'pageViews',
    'uniqueVisitors',
    'leads',
    'qualifiedLeads',
    'trials',
    'totalRevenue',
    'adSpend',
    'ctr',
    'cpa',
    'roas',
  ]

  const result: Record<string, { value: number; change: number; changePercent: number }> = {}

  for (const metric of metrics) {
    const currentValue = current[metric] as number
    const previousValue = previous[metric] as number

    result[metric] = {
      value: currentValue,
      change: currentValue - previousValue,
      changePercent: previousValue > 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : 0,
    }
  }

  return result
}

/**
 * Marketing budget benchmarks by industry
 */
export const INDUSTRY_BENCHMARKS = {
  b2b_saas: {
    marketingBudgetPercent: 10, // % of revenue
    cpaTarget: 150,
    roasTarget: 3.0,
    leadConversionTarget: 3,
    trialConversionTarget: 15,
  },
  church_software: {
    marketingBudgetPercent: 8,
    cpaTarget: 200,
    roasTarget: 2.5,
    leadConversionTarget: 4,
    trialConversionTarget: 20,
  },
  nonprofit_tech: {
    marketingBudgetPercent: 7,
    cpaTarget: 180,
    roasTarget: 2.0,
    leadConversionTarget: 3.5,
    trialConversionTarget: 18,
  },
}

/**
 * Calculate recommended marketing budget based on goals and benchmarks
 */
export function calculateRecommendedBudget(
  currentMRR: number,
  growthTarget: number, // % growth desired
  industry: keyof typeof INDUSTRY_BENCHMARKS = 'b2b_saas',
  historicalCPA?: number
): {
  recommendedMonthly: number
  recommendedDaily: number
  breakdown: Record<string, number>
  rationale: string
} {
  const benchmark = INDUSTRY_BENCHMARKS[industry]

  // Base budget on revenue percentage
  const revenueBasedBudget = currentMRR * (benchmark.marketingBudgetPercent / 100)

  // Growth-adjusted budget (more aggressive growth = higher budget)
  const growthMultiplier = 1 + (growthTarget / 100)
  const adjustedBudget = revenueBasedBudget * growthMultiplier

  // CPA-based budget (if we know historical CPA)
  const targetNewCustomers = Math.ceil((currentMRR * growthTarget / 100) / 100) // Assuming $100 ARPU
  const cpa = historicalCPA || benchmark.cpaTarget
  const cpaBasedBudget = targetNewCustomers * cpa

  // Use the higher of the two approaches
  const recommendedMonthly = Math.max(adjustedBudget, cpaBasedBudget, 1000) // Minimum $1000/month

  // Channel allocation recommendations
  const breakdown = {
    paid_search: recommendedMonthly * 0.35,
    paid_social: recommendedMonthly * 0.30,
    content_marketing: recommendedMonthly * 0.15,
    email_marketing: recommendedMonthly * 0.10,
    display_retargeting: recommendedMonthly * 0.10,
  }

  return {
    recommendedMonthly: Math.round(recommendedMonthly),
    recommendedDaily: Math.round(recommendedMonthly / 30),
    breakdown,
    rationale: `Based on ${benchmark.marketingBudgetPercent}% of MRR with ${growthTarget}% growth target. ` +
      `Target CPA: $${cpa}. Expected new customers: ${targetNewCustomers}/month.`,
  }
}

/**
 * KPI rollup scheduler config
 * Runs every 30 minutes as requested
 */
export const ROLLUP_SCHEDULE = {
  realtime: '*/30 * * * *', // Every 30 minutes
  hourly: '0 * * * *', // Top of every hour
  daily: '0 0 * * *', // Midnight daily
  weekly: '0 0 * * 0', // Midnight Sunday
  monthly: '0 0 1 * *', // Midnight 1st of month
}

/**
 * Log format for 30-minute update logs
 */
export interface RollupLog {
  timestamp: Date
  brandId: string
  period: string
  eventsProcessed: number
  kpisCalculated: number
  durationMs: number
  status: 'success' | 'error'
  error?: string
}

export function createRollupLog(
  brandId: string,
  period: string,
  eventsProcessed: number,
  startTime: number,
  error?: Error
): RollupLog {
  return {
    timestamp: new Date(),
    brandId,
    period,
    eventsProcessed,
    kpisCalculated: error ? 0 : 1,
    durationMs: Date.now() - startTime,
    status: error ? 'error' : 'success',
    error: error?.message,
  }
}
