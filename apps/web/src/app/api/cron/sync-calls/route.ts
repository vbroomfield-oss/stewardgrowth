export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { TelnyxClient } from '@/lib/calls/telnyx-client'

/**
 * GET /api/cron/sync-calls
 * Cron job to sync Telnyx call data into CallEvent model
 * Runs every 2 hours
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const isDev = process.env.NODE_ENV === 'development'

    if (!isDev && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all organizations with Telnyx configured
    const orgs = await db.organization.findMany({
      select: { id: true, settings: true },
    })

    let totalSynced = 0
    let totalErrors = 0

    for (const org of orgs) {
      const settings = (org.settings as Record<string, any>) || {}
      const apiKey = settings.TELNYX_API_KEY

      if (!apiKey) continue

      try {
        const client = new TelnyxClient(apiKey)

        // Sync calls from last 24 hours
        const endDate = new Date().toISOString()
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

        const calls = await client.getCalls({ startDate, endDate, pageSize: 200 })

        // Get brands in this org to link calls
        const brands = await db.saaSBrand.findMany({
          where: { organizationId: org.id },
          select: { id: true },
        })

        const defaultBrandId = brands[0]?.id

        if (!defaultBrandId) continue

        for (const call of calls) {
          try {
            await db.callEvent.upsert({
              where: { stewardringCallId: call.callControlId },
              update: {
                direction: call.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
                callerId: call.from,
                callerPhone: call.to,
                startedAt: new Date(call.startTime),
                endedAt: call.endTime ? new Date(call.endTime) : null,
                duration: call.duration || 0,
                outcome: mapCallOutcome(call),
              },
              create: {
                brandId: defaultBrandId,
                stewardringCallId: call.callControlId,
                direction: call.direction === 'inbound' ? 'INBOUND' : 'OUTBOUND',
                callerId: call.from,
                callerPhone: call.to,
                startedAt: new Date(call.startTime),
                endedAt: call.endTime ? new Date(call.endTime) : null,
                duration: call.duration || 0,
                outcome: mapCallOutcome(call),
              },
            })
            totalSynced++
          } catch {
            totalErrors++
          }
        }
      } catch (error) {
        console.error(`Telnyx sync error for org ${org.id}:`, error)
        totalErrors++
      }
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      errors: totalErrors,
    })
  } catch (error) {
    console.error('Sync calls cron error:', error)
    return NextResponse.json({ error: 'Failed to sync calls' }, { status: 500 })
  }
}

function mapCallOutcome(call: any): 'COMPLETED' | 'MISSED' | 'NO_ANSWER' {
  if (call.status === 'call.answered' || (call.duration && call.duration > 5)) {
    return 'COMPLETED'
  }
  if (call.status === 'call.hangup' && (!call.duration || call.duration < 5)) {
    return 'MISSED'
  }
  return 'NO_ANSWER'
}
