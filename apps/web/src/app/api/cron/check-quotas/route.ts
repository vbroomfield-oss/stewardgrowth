import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendQuotaAlert, type ServiceQuota } from '@/lib/email/quota-alert'

function verifyCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (process.env.CRON_SECRET) {
    return authHeader === `Bearer ${process.env.CRON_SECRET}`
  }
  return process.env.NODE_ENV === 'development'
}

// Thresholds for alerts
const ELEVENLABS_WARN = 5000    // characters
const ELEVENLABS_CRITICAL = 1000
const SHOTSTACK_WARN = 5        // renders remaining (out of 20/month free)
const SHOTSTACK_CRITICAL = 2

/**
 * GET /api/cron/check-quotas
 *
 * Runs daily at 7 AM UTC (before content generation at 11 AM)
 * Checks API quotas for all video/AI services and sends email alerts
 */
export async function GET(request: NextRequest) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] Checking service quotas...')

    const services: ServiceQuota[] = []

    // ── ElevenLabs ──
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
          headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
        })

        if (response.ok) {
          const data = await response.json()
          const used = data.character_count || 0
          const limit = data.character_limit || 0
          const remaining = limit - used

          services.push({
            name: 'ElevenLabs',
            used,
            limit,
            remaining,
            unit: 'characters',
            status: remaining < ELEVENLABS_CRITICAL ? 'critical'
              : remaining < ELEVENLABS_WARN ? 'warning' : 'ok',
          })

          console.log(`[Quota] ElevenLabs: ${remaining.toLocaleString()} / ${limit.toLocaleString()} chars remaining`)
        } else {
          services.push({
            name: 'ElevenLabs',
            used: 0, limit: 0, remaining: 0, unit: 'characters',
            status: 'critical',
            error: `API returned ${response.status}`,
          })
        }
      } catch (error) {
        console.error('[Quota] ElevenLabs check failed:', error)
        services.push({
          name: 'ElevenLabs',
          used: 0, limit: 0, remaining: 0, unit: 'characters',
          status: 'critical',
          error: 'Failed to check quota',
        })
      }
    }

    // ── Shotstack ──
    if (process.env.SHOTSTACK_API_KEY) {
      try {
        // Count renders this month by checking our database for videos started this month
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const videosThisMonth = await db.contentPost.count({
          where: {
            updatedAt: { gte: startOfMonth },
            platforms: { hasSome: ['tiktok', 'youtube', 'facebook', 'instagram'] },
          },
        })

        // Shotstack free tier: 20 renders/month
        const limit = 20
        const used = Math.min(videosThisMonth, limit)
        const remaining = Math.max(limit - used, 0)

        services.push({
          name: 'Shotstack',
          used,
          limit,
          remaining,
          unit: 'renders',
          status: remaining < SHOTSTACK_CRITICAL ? 'critical'
            : remaining < SHOTSTACK_WARN ? 'warning' : 'ok',
        })

        console.log(`[Quota] Shotstack: ~${remaining} / ${limit} renders remaining this month`)
      } catch (error) {
        console.error('[Quota] Shotstack check failed:', error)
      }
    }

    // ── HeyGen ──
    if (process.env.HEYGEN_API_KEY) {
      try {
        const response = await fetch('https://api.heygen.com/v1/user/remaining_quota', {
          headers: { 'X-Api-Key': process.env.HEYGEN_API_KEY },
        })

        if (response.ok) {
          const data = await response.json()
          const remaining = data.data?.remaining_quota || 0
          // HeyGen quota is in seconds of video
          services.push({
            name: 'HeyGen',
            used: 0, // HeyGen API doesn't return used count directly
            limit: remaining, // Use remaining as best estimate
            remaining,
            unit: 'seconds',
            status: remaining < 60 ? 'critical' : remaining < 300 ? 'warning' : 'ok',
          })

          console.log(`[Quota] HeyGen: ${remaining}s remaining`)
        } else {
          services.push({
            name: 'HeyGen',
            used: 0, limit: 0, remaining: 0, unit: 'seconds',
            status: 'critical',
            error: `API returned ${response.status}`,
          })
        }
      } catch (error) {
        console.error('[Quota] HeyGen check failed:', error)
        services.push({
          name: 'HeyGen',
          used: 0, limit: 0, remaining: 0, unit: 'seconds',
          status: 'critical',
          error: 'Failed to check quota',
        })
      }
    }

    // ── OpenAI (health check only — no quota API) ──
    if (process.env.OPENAI_API_KEY) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
        })

        if (response.ok) {
          services.push({
            name: 'OpenAI',
            used: 0, limit: 0, remaining: 0, unit: 'status',
            status: 'ok',
          })
          console.log('[Quota] OpenAI: API accessible')
        } else {
          services.push({
            name: 'OpenAI',
            used: 0, limit: 0, remaining: 0, unit: 'status',
            status: response.status === 429 ? 'warning' : 'critical',
            error: `API returned ${response.status}`,
          })
        }
      } catch (error) {
        console.error('[Quota] OpenAI check failed:', error)
      }
    }

    // ── Send alert emails if any service is low ──
    const hasAlerts = services.some(s => s.status === 'warning' || s.status === 'critical')

    if (hasAlerts) {
      console.log('[Quota] Low quotas detected, sending alerts...')

      // Find org admins/owners to notify
      const members = await db.organizationMember.findMany({
        where: { role: { in: ['OWNER', 'ADMIN'] } },
        include: { user: true },
      })

      let emailsSent = 0
      for (const member of members) {
        if (member.user.email) {
          try {
            await sendQuotaAlert({
              to: member.user.email,
              userName: member.user.firstName || 'there',
              services,
            })
            emailsSent++
            console.log(`[Quota] Alert sent to ${member.user.email}`)
          } catch (error) {
            console.error(`[Quota] Failed to send alert to ${member.user.email}:`, error)
          }
        }
      }

      return NextResponse.json({
        success: true,
        services,
        alertsSent: emailsSent,
      })
    }

    console.log('[Quota] All services OK')

    return NextResponse.json({
      success: true,
      services,
      alertsSent: 0,
    })
  } catch (error) {
    console.error('[Cron] Error checking quotas:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
