import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

export interface ServiceHealthItem {
  name: string
  configured: boolean
  status: 'ok' | 'warning' | 'critical' | 'unconfigured' | 'checking'
  remaining?: number
  limit?: number
  unit?: string
  error?: string
}

/**
 * GET /api/settings/service-health
 *
 * Checks the health and quota of all configured external services.
 * Returns status for each service used in video/content generation.
 */
export async function GET() {
  const user = await getUserWithOrganization()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const services: ServiceHealthItem[] = []

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
          configured: true,
          status: remaining < 1000 ? 'critical' : remaining < 5000 ? 'warning' : 'ok',
          remaining,
          limit,
          unit: 'characters',
        })
      } else {
        services.push({
          name: 'ElevenLabs',
          configured: true,
          status: 'critical',
          error: `API error: ${response.status}`,
        })
      }
    } catch {
      services.push({
        name: 'ElevenLabs',
        configured: true,
        status: 'critical',
        error: 'Connection failed',
      })
    }
  } else {
    services.push({ name: 'ElevenLabs', configured: false, status: 'unconfigured' })
  }

  // ── Shotstack ──
  if (process.env.SHOTSTACK_API_KEY) {
    try {
      // Quick API check — probe the stage endpoint
      const response = await fetch('https://api.shotstack.io/stage/render', {
        method: 'HEAD',
        headers: { 'x-api-key': process.env.SHOTSTACK_API_KEY },
      })

      services.push({
        name: 'Shotstack',
        configured: true,
        status: response.status === 405 || response.ok ? 'ok' : 'warning',
        limit: 20,
        unit: 'renders/month (free tier)',
      })
    } catch {
      services.push({
        name: 'Shotstack',
        configured: true,
        status: 'critical',
        error: 'Connection failed',
      })
    }
  } else {
    services.push({ name: 'Shotstack', configured: false, status: 'unconfigured' })
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

        services.push({
          name: 'HeyGen',
          configured: true,
          status: remaining < 60 ? 'critical' : remaining < 300 ? 'warning' : 'ok',
          remaining,
          unit: 'seconds',
        })
      } else {
        services.push({
          name: 'HeyGen',
          configured: true,
          status: 'critical',
          error: `API error: ${response.status}`,
        })
      }
    } catch {
      services.push({
        name: 'HeyGen',
        configured: true,
        status: 'critical',
        error: 'Connection failed',
      })
    }
  } else {
    services.push({ name: 'HeyGen', configured: false, status: 'unconfigured' })
  }

  // ── OpenAI ──
  if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      })

      services.push({
        name: 'OpenAI',
        configured: true,
        status: response.ok ? 'ok' : response.status === 429 ? 'warning' : 'critical',
        error: response.ok ? undefined : `API error: ${response.status}`,
      })
    } catch {
      services.push({
        name: 'OpenAI',
        configured: true,
        status: 'critical',
        error: 'Connection failed',
      })
    }
  } else {
    services.push({ name: 'OpenAI', configured: false, status: 'unconfigured' })
  }

  // ── Resend (Email) ──
  services.push({
    name: 'Resend (Email)',
    configured: !!process.env.RESEND_API_KEY,
    status: process.env.RESEND_API_KEY ? 'ok' : 'unconfigured',
  })

  // ── Anthropic ──
  services.push({
    name: 'Anthropic',
    configured: !!process.env.ANTHROPIC_API_KEY,
    status: process.env.ANTHROPIC_API_KEY ? 'ok' : 'unconfigured',
  })

  return NextResponse.json({ services })
}
