export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  processEvent,
  processBatch,
  marketingEventSchema,
  type MarketingEventInput,
} from '@/lib/analytics/event-processor'

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
 * Authentication: API Key or Bearer token
 *
 * Single event:
 * { "brandId": "...", "eventType": "page_view", ... }
 *
 * Batch:
 * { "events": [{ ... }, { ... }] }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Get API key from header
    const apiKey = request.headers.get('x-api-key')
    const authHeader = request.headers.get('authorization')

    let organizationId: string | null = null

    // API Key authentication (for SDK/server-side)
    if (apiKey) {
      // In production: Validate API key and get organization
      // const org = await validateApiKey(apiKey)
      organizationId = 'org_demo' // Mock for now
    }
    // Bearer token authentication (for authenticated users)
    else if (authHeader?.startsWith('Bearer ')) {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error || !user) {
        return NextResponse.json(
          { success: false, error: 'Invalid authentication' },
          { status: 401 }
        )
      }

      // In production: Get user's organization
      organizationId = 'org_demo' // Mock for now
    } else {
      return NextResponse.json(
        { success: false, error: 'API key or Bearer token required' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Handle batch vs single event
    const isBatch = Array.isArray(body.events)
    const events: MarketingEventInput[] = isBatch ? body.events : [body]

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

    // Check rate limit for each brand
    const brandIds = Array.from(new Set(events.map(e => e.brandId)))
    for (const brandId of brandIds) {
      if (!checkRateLimit(brandId)) {
        return NextResponse.json(
          {
            success: false,
            error: `Rate limit exceeded for brand ${brandId}`,
            retryAfter: 60,
          },
          { status: 429 }
        )
      }
    }

    // Process events
    const result = await processBatch(events, organizationId)

    // In production: Store events in database
    // await db.marketingEvent.createMany({ data: result.successful })

    // Log ingestion metrics (every 30 minutes in production via cron)
    const processingTime = Date.now() - startTime

    // Success response
    if (isBatch) {
      return NextResponse.json({
        success: true,
        data: {
          accepted: result.successful.length,
          rejected: result.failed.length,
          errors: result.failed.length > 0 ? result.failed : undefined,
          processingTimeMs: processingTime,
        },
      })
    } else {
      if (result.successful.length > 0) {
        return NextResponse.json({
          success: true,
          data: {
            eventId: result.successful[0].id,
            processingTimeMs: processingTime,
          },
        })
      } else {
        return NextResponse.json(
          {
            success: false,
            error: result.failed[0]?.error || 'Event processing failed',
          },
          { status: 400 }
        )
      }
    }
  } catch (error) {
    console.error('Event ingestion error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process events' },
      { status: 500 }
    )
  }
}

/**
 * OPTIONS /api/events/ingest
 * CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key, Authorization',
    },
  })
}
