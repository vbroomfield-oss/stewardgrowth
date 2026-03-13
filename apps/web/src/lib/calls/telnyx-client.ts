const TELNYX_API_URL = 'https://api.telnyx.com/v2'

export interface TelnyxCall {
  id: string
  callControlId: string
  direction: 'inbound' | 'outbound'
  from: string
  to: string
  startTime: string
  endTime?: string
  duration?: number
  status: string
  recordType: string
}

export interface TelnyxCallSummary {
  totalCalls: number
  inboundCalls: number
  outboundCalls: number
  missedCalls: number
  avgDuration: number
  totalDuration: number
}

export class TelnyxClient {
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async getCalls(options: {
    startDate: string
    endDate: string
    direction?: 'inbound' | 'outbound'
    pageSize?: number
    pageNumber?: number
  }): Promise<TelnyxCall[]> {
    const params = new URLSearchParams({
      'filter[start_time][gte]': options.startDate,
      'filter[start_time][lte]': options.endDate,
      'page[size]': String(options.pageSize || 100),
      'page[number]': String(options.pageNumber || 1),
    })

    if (options.direction) {
      params.set('filter[direction]', options.direction)
    }

    const response = await fetch(`${TELNYX_API_URL}/call_events?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Telnyx API error: ${error}`)
    }

    const data = await response.json()

    // Group call events by call_control_id to get unique calls
    const callMap = new Map<string, TelnyxCall>()

    for (const event of (data.data || [])) {
      const attrs = event.attributes || event
      const callId = attrs.call_control_id || attrs.id

      if (!callMap.has(callId)) {
        callMap.set(callId, {
          id: event.id || callId,
          callControlId: callId,
          direction: attrs.direction || 'inbound',
          from: attrs.from || '',
          to: attrs.to || '',
          startTime: attrs.start_time || attrs.occurred_at || '',
          endTime: attrs.end_time,
          duration: attrs.duration_secs || 0,
          status: attrs.type || 'unknown',
          recordType: attrs.record_type || 'call_event',
        })
      }
    }

    return Array.from(callMap.values())
  }

  async getCallSummary(startDate: string, endDate: string): Promise<TelnyxCallSummary> {
    const calls = await this.getCalls({ startDate, endDate, pageSize: 250 })

    const inbound = calls.filter(c => c.direction === 'inbound')
    const outbound = calls.filter(c => c.direction === 'outbound')
    const missed = calls.filter(c =>
      c.status === 'call.hangup' && (c.duration || 0) < 5 && c.direction === 'inbound'
    )

    const totalDuration = calls.reduce((sum, c) => sum + (c.duration || 0), 0)

    return {
      totalCalls: calls.length,
      inboundCalls: inbound.length,
      outboundCalls: outbound.length,
      missedCalls: missed.length,
      avgDuration: calls.length > 0 ? Math.round(totalDuration / calls.length) : 0,
      totalDuration,
    }
  }
}
