export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Map incoming event type strings to Prisma EventType enum
const EVENT_TYPE_MAP: Record<string, string> = {
  // Traffic
  'page_view': 'PAGE_VIEW',
  'session_start': 'SESSION_START',
  'session_end': 'SESSION_END',
  // Lead Generation
  'lead_captured': 'LEAD_CAPTURED',
  'form_submitted': 'FORM_SUBMITTED',
  'demo_requested': 'DEMO_REQUESTED',
  // Signup Funnel
  'signup_started': 'SIGNUP_STARTED',
  'signup_completed': 'SIGNUP_COMPLETED',
  'email_verified': 'EMAIL_VERIFIED',
  // Trial
  'trial_started': 'TRIAL_STARTED',
  'trial_extended': 'TRIAL_EXTENDED',
  'trial_ended': 'TRIAL_ENDED',
  // Subscription
  'subscription_started': 'SUBSCRIPTION_STARTED',
  'subscription_upgraded': 'SUBSCRIPTION_UPGRADED',
  'subscription_downgraded': 'SUBSCRIPTION_DOWNGRADED',
  'subscription_cancelled': 'SUBSCRIPTION_CANCELLED',
  // Payment
  'payment_succeeded': 'PAYMENT_SUCCEEDED',
  'payment_failed': 'PAYMENT_FAILED',
  'refund_issued': 'REFUND_ISSUED',
  // Churn
  'churned': 'CHURNED',
  'reactivated': 'REACTIVATED',
  // Engagement
  'feature_used': 'FEATURE_USED',
  'support_ticket': 'SUPPORT_TICKET',
  // Calls
  'call_started': 'CALL_STARTED',
  'call_completed': 'CALL_COMPLETED',
  'call_missed': 'CALL_MISSED',
  'voicemail_left': 'VOICEMAIL_LEFT',
  // Also support identify as page view for tracking
  'identify': 'PAGE_VIEW',
}

// Rate limiting - simple in-memory (use Redis in production)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 1000 // events per minute per brand
const RATE_WINDOW = 60000 // 1 minute

function checkRateLimit(brandId: string): boolean {
  const now = Date.now()
  const limit = rateLimits.get(brandId)

  if (!limit || now > limit.resetAt) {
    rateLimits.set(brandId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (limit.count >= RATE_LIMIT) {
    return false
  }

  limit.count++
  return true
}

/**
 * POST /api/events/ingest
 *
 * High-throughput event ingestion endpoint.
 * Accepts single events or batches (up to 100 events).
 *
 * Authentication: API Key in x-api-key header
 *
 * Single event:
 * { "brandId": "SG-XXXXXX", "eventType": "page_view", ... }
 *
 * Batch:
 * { "events": [{ ... }, { ... }] }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required in x-api-key header' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Handle batch vs single event
    const isBatch = Array.isArray(body.events)
    const events = isBatch ? body.events : [body]

    // Validate batch size
    if (events.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Maximum 100 events per batch' },
        { status: 400 }
      )
    }

    if (events.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No events provided' },
        { status: 400 }
      )
    }

    // Process and save events
    const successful: any[] = []
    const failed: any[] = []

    for (const event of events) {
      try {
        // Get brandId - could be tracking ID or actual brand ID
        const trackingId = event.brandId

        if (!trackingId) {
          failed.push({ event, error: 'brandId is required' })
          continue
        }

        // Check rate limit
        if (!checkRateLimit(trackingId)) {
          failed.push({ event, error: 'Rate limit exceeded' })
          continue
        }

        // Find brand by tracking ID (stored in settings.tracking.trackingId)
        // or by actual brand ID
        let brand = await db.saaSBrand.findFirst({
          where: {
            OR: [
              { id: trackingId },
              {
                settings: {
                  path: ['tracking', 'trackingId'],
                  equals: trackingId,
                },
              },
            ],
            deletedAt: null,
          },
        })

        if (!brand) {
          failed.push({ event, error: 'Invalid brand ID' })
          continue
        }

        // Validate API key matches
        const brandSettings = brand.settings as any
        if (brandSettings?.tracking?.apiKey !== apiKey) {
          failed.push({ event, error: 'Invalid API key for this brand' })
          continue
        }

        // Map event type
        const eventType = EVENT_TYPE_MAP[event.eventType?.toLowerCase()] || 'PAGE_VIEW'

        // Create the event in database
        const savedEvent = await db.marketingEvent.create({
          data: {
            brandId: brand.id,
            eventName: eventType as any,
            timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
            userId: event.properties?.userId || event.userId || null,
            anonymousId: event.visitorId || null,
            sessionId: event.sessionId || null,
            utmSource: event.utmSource || null,
            utmMedium: event.utmMedium || null,
            utmCampaign: event.utmCampaign || null,
            utmTerm: event.utmTerm || null,
            utmContent: event.utmContent || null,
            referrer: event.referrer || null,
            landingPage: event.url || null,
            properties: event.properties || {},
            revenue: event.properties?.revenue || event.revenue || null,
            currency: event.properties?.currency || event.currency || 'USD',
            processedAt: new Date(),
          },
        })

        successful.push({ id: savedEvent.id, eventType: savedEvent.eventName })
      } catch (err: any) {
        console.error('Error processing event:', err)
        failed.push({ event, error: err.message || 'Processing failed' })
      }
    }

    const processingTime = Date.now() - startTime

    // Success response
    if (isBatch) {
      return NextResponse.json({
        success: true,
        data: {
          accepted: successful.length,
          rejected: failed.length,
          errors: failed.length > 0 ? failed.map(f => f.error) : undefined,
          processingTimeMs: processingTime,
        },
      })
    } else {
      if (successful.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            eventId: successful[0].id,
            processingTimeMs: processingTime,
          },
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: failed[0]?.error || 'Event processing failed',
          },
          { status: 400 }
        )
      }
    }
  } catch (error: any) {
    console.error('Event ingestion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process events' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/events/ingest
 * CORS preflight - allow any origin for tracking script
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  })
}

/**
 * GET /api/events/ingest
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Event ingest API is running',
    timestamp: new Date().toISOString(),
  })
}
