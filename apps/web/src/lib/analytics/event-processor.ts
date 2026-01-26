/**
 * Event Processor
 *
 * Handles validation, transformation, and storage of marketing events.
 * Designed for high-throughput ingestion from multiple sources.
 */

import { z } from 'zod'

// Event Types - All trackable marketing events
export const EventType = {
  // Website Events
  PAGE_VIEW: 'page_view',
  SESSION_START: 'session_start',
  SESSION_END: 'session_end',

  // Engagement Events
  BUTTON_CLICK: 'button_click',
  FORM_START: 'form_start',
  FORM_SUBMIT: 'form_submit',
  FORM_ABANDON: 'form_abandon',
  VIDEO_PLAY: 'video_play',
  VIDEO_COMPLETE: 'video_complete',
  SCROLL_DEPTH: 'scroll_depth',

  // Lead Events
  LEAD_CAPTURED: 'lead_captured',
  LEAD_QUALIFIED: 'lead_qualified',
  DEMO_REQUESTED: 'demo_requested',
  DEMO_COMPLETED: 'demo_completed',

  // Trial/Signup Events
  TRIAL_STARTED: 'trial_started',
  TRIAL_ACTIVATED: 'trial_activated',
  TRIAL_CONVERTED: 'trial_converted',
  TRIAL_EXPIRED: 'trial_expired',

  // Subscription Events
  SUBSCRIPTION_STARTED: 'subscription_started',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',

  // Revenue Events
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  REFUND_ISSUED: 'refund_issued',

  // Ad Events
  AD_IMPRESSION: 'ad_impression',
  AD_CLICK: 'ad_click',
  AD_CONVERSION: 'ad_conversion',

  // Email Events
  EMAIL_SENT: 'email_sent',
  EMAIL_DELIVERED: 'email_delivered',
  EMAIL_OPENED: 'email_opened',
  EMAIL_CLICKED: 'email_clicked',
  EMAIL_BOUNCED: 'email_bounced',
  EMAIL_UNSUBSCRIBED: 'email_unsubscribed',

  // Call Events (from StewardRing)
  CALL_STARTED: 'call_started',
  CALL_ANSWERED: 'call_answered',
  CALL_COMPLETED: 'call_completed',
  CALL_MISSED: 'call_missed',

  // Custom Events
  CUSTOM: 'custom',
} as const

export type EventTypeValue = typeof EventType[keyof typeof EventType]

// UTM Parameters Schema
const utmSchema = z.object({
  source: z.string().optional(),
  medium: z.string().optional(),
  campaign: z.string().optional(),
  term: z.string().optional(),
  content: z.string().optional(),
})

// Event Schema for validation
export const marketingEventSchema = z.object({
  // Required fields
  brandId: z.string().uuid(),
  eventType: z.string(),
  timestamp: z.string().datetime().or(z.date()),

  // Identity
  sessionId: z.string().optional(),
  visitorId: z.string().optional(),
  userId: z.string().optional(),

  // Source tracking
  source: z.string().optional(),
  medium: z.string().optional(),
  channel: z.string().optional(),

  // UTM tracking
  utm: utmSchema.optional(),

  // Page/URL context
  pageUrl: z.string().url().optional(),
  pageTitle: z.string().optional(),
  referrer: z.string().optional(),

  // Device/Browser
  deviceType: z.enum(['desktop', 'mobile', 'tablet']).optional(),
  browser: z.string().optional(),
  os: z.string().optional(),

  // Geo
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),

  // Revenue
  revenue: z.number().optional(),
  currency: z.string().default('USD'),

  // Custom properties
  properties: z.record(z.unknown()).optional(),

  // Ad platform data
  adPlatform: z.string().optional(),
  campaignId: z.string().optional(),
  adGroupId: z.string().optional(),
  adId: z.string().optional(),
  keyword: z.string().optional(),
})

export type MarketingEventInput = z.infer<typeof marketingEventSchema>

// Processed event ready for storage
export interface ProcessedEvent extends MarketingEventInput {
  id: string
  organizationId: string
  processedAt: Date
  channel: string
  attributionScore?: number
}

// Channel detection rules
const channelRules = [
  { pattern: /google.*cpc|adwords/i, channel: 'paid_search' },
  { pattern: /google|bing|yahoo|duckduckgo/i, channel: 'organic_search' },
  { pattern: /facebook|instagram|meta/i, channel: 'paid_social' },
  { pattern: /linkedin/i, channel: 'paid_social' },
  { pattern: /tiktok/i, channel: 'paid_social' },
  { pattern: /twitter|x\.com/i, channel: 'organic_social' },
  { pattern: /email|newsletter/i, channel: 'email' },
  { pattern: /affiliate/i, channel: 'affiliate' },
  { pattern: /referral/i, channel: 'referral' },
]

/**
 * Detect marketing channel from UTM and referrer data
 */
export function detectChannel(event: MarketingEventInput): string {
  const source = event.utm?.source || event.source || ''
  const medium = event.utm?.medium || event.medium || ''
  const referrer = event.referrer || ''

  // Check UTM medium first
  if (medium) {
    if (/cpc|ppc|paid/i.test(medium)) {
      if (/social/i.test(medium)) return 'paid_social'
      return 'paid_search'
    }
    if (/email/i.test(medium)) return 'email'
    if (/affiliate/i.test(medium)) return 'affiliate'
    if (/referral/i.test(medium)) return 'referral'
    if (/organic/i.test(medium)) return 'organic_search'
  }

  // Check source patterns
  const combinedSource = `${source} ${referrer}`.toLowerCase()
  for (const rule of channelRules) {
    if (rule.pattern.test(combinedSource)) {
      return rule.channel
    }
  }

  // Default based on referrer presence
  if (referrer && referrer !== '') {
    return 'referral'
  }

  return 'direct'
}

/**
 * Validate and process a single event
 */
export async function processEvent(
  event: MarketingEventInput,
  organizationId: string
): Promise<{ success: boolean; event?: ProcessedEvent; error?: string }> {
  try {
    // Validate event structure
    const validated = marketingEventSchema.parse(event)

    // Detect channel if not provided
    const channel = validated.channel || detectChannel(validated)

    // Generate event ID
    const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

    const processedEvent: ProcessedEvent = {
      ...validated,
      id,
      organizationId,
      channel,
      processedAt: new Date(),
      timestamp: new Date(validated.timestamp),
    }

    return { success: true, event: processedEvent }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation failed: ${error.errors.map(e => e.message).join(', ')}`
      }
    }
    return { success: false, error: 'Unknown processing error' }
  }
}

/**
 * Batch process multiple events
 */
export async function processBatch(
  events: MarketingEventInput[],
  organizationId: string
): Promise<{
  successful: ProcessedEvent[]
  failed: Array<{ index: number; error: string }>
}> {
  const successful: ProcessedEvent[] = []
  const failed: Array<{ index: number; error: string }> = []

  for (let i = 0; i < events.length; i++) {
    const result = await processEvent(events[i], organizationId)
    if (result.success && result.event) {
      successful.push(result.event)
    } else {
      failed.push({ index: i, error: result.error || 'Unknown error' })
    }
  }

  return { successful, failed }
}

/**
 * Event deduplication check
 */
export function isDuplicate(
  event: MarketingEventInput,
  recentEvents: ProcessedEvent[],
  windowMs: number = 5000
): boolean {
  const eventTime = new Date(event.timestamp).getTime()

  return recentEvents.some(recent => {
    const recentTime = new Date(recent.timestamp).getTime()
    const timeDiff = Math.abs(eventTime - recentTime)

    return (
      timeDiff < windowMs &&
      recent.brandId === event.brandId &&
      recent.eventType === event.eventType &&
      recent.sessionId === event.sessionId &&
      recent.pageUrl === event.pageUrl
    )
  })
}

/**
 * Calculate conversion value for an event
 */
export function getConversionValue(event: ProcessedEvent): number {
  // Direct revenue events
  if (event.revenue && event.revenue > 0) {
    return event.revenue
  }

  // Estimated values for conversion events
  const conversionValues: Record<string, number> = {
    [EventType.LEAD_CAPTURED]: 50,
    [EventType.LEAD_QUALIFIED]: 150,
    [EventType.DEMO_REQUESTED]: 200,
    [EventType.DEMO_COMPLETED]: 500,
    [EventType.TRIAL_STARTED]: 100,
    [EventType.TRIAL_ACTIVATED]: 250,
    [EventType.TRIAL_CONVERTED]: 1000,
    [EventType.SUBSCRIPTION_STARTED]: 1000,
    [EventType.SUBSCRIPTION_UPGRADED]: 500,
  }

  return conversionValues[event.eventType] || 0
}

/**
 * Event categories for reporting
 */
export const EventCategories = {
  AWARENESS: [EventType.PAGE_VIEW, EventType.AD_IMPRESSION, EventType.VIDEO_PLAY],
  ENGAGEMENT: [EventType.BUTTON_CLICK, EventType.FORM_START, EventType.SCROLL_DEPTH, EventType.VIDEO_COMPLETE],
  ACQUISITION: [EventType.LEAD_CAPTURED, EventType.FORM_SUBMIT, EventType.DEMO_REQUESTED],
  ACTIVATION: [EventType.TRIAL_STARTED, EventType.TRIAL_ACTIVATED, EventType.DEMO_COMPLETED],
  REVENUE: [EventType.SUBSCRIPTION_STARTED, EventType.PAYMENT_COMPLETED, EventType.TRIAL_CONVERTED],
  RETENTION: [EventType.SUBSCRIPTION_RENEWED, EventType.SUBSCRIPTION_UPGRADED],
  CHURN: [EventType.SUBSCRIPTION_CANCELED, EventType.SUBSCRIPTION_DOWNGRADED, EventType.TRIAL_EXPIRED],
}

export function categorizeEvent(eventType: string): string {
  for (const [category, types] of Object.entries(EventCategories)) {
    if ((types as string[]).includes(eventType)) {
      return category.toLowerCase()
    }
  }
  return 'other'
}
