import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  /** Maximum number of requests allowed within the window */
  limit: number
  /** Time window in milliseconds */
  windowMs: number
  /** Function to derive a unique key from the request (defaults to IP address) */
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitResult {
  /** Whether the request is allowed */
  success: boolean
  /** Number of requests remaining in the current window */
  remaining: number
  /** Unix timestamp (ms) when the window resets */
  reset: number
}

interface SlidingWindowEntry {
  timestamps: number[]
}

type RateLimitChecker = (req: NextRequest) => RateLimitResult

type RouteHandler = (
  req: NextRequest,
  context?: unknown
) => Promise<NextResponse> | NextResponse

/**
 * Default key generator that extracts the client IP from common proxy headers.
 * Falls back to "unknown" if no IP header is present.
 */
function defaultKeyGenerator(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Creates a sliding-window rate limiter backed by an in-memory Map.
 *
 * Expired timestamps are pruned on every check, and entries with no remaining
 * timestamps are deleted entirely so the Map does not grow without bound.
 *
 * @example
 * ```ts
 * const check = rateLimit({ limit: 10, windowMs: 60_000 })
 *
 * export async function GET(req: NextRequest) {
 *   const { success, remaining, reset } = check(req)
 *   if (!success) {
 *     return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 *   }
 *   // ...handle request
 * }
 * ```
 */
export function rateLimit(options: RateLimitOptions): RateLimitChecker {
  const { limit, windowMs, keyGenerator = defaultKeyGenerator } = options
  const store = new Map<string, SlidingWindowEntry>()

  // Periodically sweep the store to remove fully-expired entries so memory
  // does not accumulate when keys stop sending requests.
  const cleanupIntervalMs = Math.max(windowMs, 60_000)
  const cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, cleanupIntervalMs)

  // Allow the Node process to exit even if the interval is still active.
  if (
    cleanupInterval &&
    typeof cleanupInterval === 'object' &&
    'unref' in cleanupInterval
  ) {
    cleanupInterval.unref()
  }

  return function check(req: NextRequest): RateLimitResult {
    const now = Date.now()
    const key = keyGenerator(req)

    let entry = store.get(key)

    if (!entry) {
      entry = { timestamps: [] }
      store.set(key, entry)
    }

    // Slide the window: discard timestamps outside the current window.
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

    if (entry.timestamps.length < limit) {
      // Request is allowed -- record it.
      entry.timestamps.push(now)

      const oldestInWindow = entry.timestamps[0] ?? now
      const reset = oldestInWindow + windowMs

      return {
        success: true,
        remaining: limit - entry.timestamps.length,
        reset,
      }
    }

    // Rate limit exceeded.
    const oldestInWindow = entry.timestamps[0]
    const reset = oldestInWindow + windowMs

    // Clean up the entry if it is empty (should not happen here, but be safe).
    if (entry.timestamps.length === 0) {
      store.delete(key)
    }

    return {
      success: false,
      remaining: 0,
      reset,
    }
  }
}

/**
 * Wraps a route handler with rate-limit protection.
 *
 * If the limit is exceeded the wrapper returns a 429 JSON response with
 * `Retry-After` and `X-RateLimit-*` headers. Otherwise the original handler
 * is invoked and rate-limit headers are added to its response.
 *
 * @example
 * ```ts
 * const handler = async (req: NextRequest) => {
 *   return NextResponse.json({ data: 'ok' })
 * }
 *
 * export const GET = withRateLimit(handler, { limit: 30, windowMs: 60_000 })
 * ```
 */
export function withRateLimit(
  handler: RouteHandler,
  options: RateLimitOptions
): RouteHandler {
  const check = rateLimit(options)

  return async function rateLimitedHandler(
    req: NextRequest,
    context?: unknown
  ): Promise<NextResponse> {
    const { success, remaining, reset } = check(req)

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000)

      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.max(retryAfterSeconds, 1)),
            'X-RateLimit-Limit': String(options.limit),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(reset),
          },
        }
      )
    }

    const response = await handler(req, context)

    // Append rate-limit headers to the successful response.
    response.headers.set('X-RateLimit-Limit', String(options.limit))
    response.headers.set('X-RateLimit-Remaining', String(remaining))
    response.headers.set('X-RateLimit-Reset', String(reset))

    return response
  }
}
