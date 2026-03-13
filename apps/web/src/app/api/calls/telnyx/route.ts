export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { TelnyxClient } from '@/lib/calls/telnyx-client'

function getDateRange(range: string): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()

  switch (range) {
    case '7d': start.setDate(end.getDate() - 7); break
    case '90d': start.setDate(end.getDate() - 90); break
    case '30d':
    default: start.setDate(end.getDate() - 30); break
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

/**
 * GET /api/calls/telnyx?range=7d|30d|90d
 * Returns Telnyx call analytics
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // Get Telnyx API key from org settings
    const org = await db.organization.findUnique({
      where: { id: userWithOrg.organizationId },
      select: { settings: true },
    })

    const settings = (org?.settings as Record<string, any>) || {}
    const apiKey = settings.TELNYX_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        error: 'Telnyx API key not configured. Add it in Settings > Integrations.',
      }, { status: 400 })
    }

    const client = new TelnyxClient(apiKey)
    const { startDate, endDate } = getDateRange(range)

    const [summary, calls] = await Promise.all([
      client.getCallSummary(startDate, endDate),
      client.getCalls({ startDate, endDate, pageSize: 50 }),
    ])

    return NextResponse.json({
      success: true,
      range,
      summary,
      recentCalls: calls.slice(0, 25).map(call => ({
        id: call.id,
        direction: call.direction,
        from: call.from,
        to: call.to,
        startTime: call.startTime,
        duration: call.duration,
        status: call.status,
      })),
    })
  } catch (error) {
    console.error('Telnyx API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch call data. Check your Telnyx API key.' },
      { status: 500 }
    )
  }
}
