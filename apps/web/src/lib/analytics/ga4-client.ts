import { BetaAnalyticsDataClient } from '@google-analytics/data'

export interface GA4Overview {
  pageviews: number
  sessions: number
  users: number
  bounceRate: number
  avgSessionDuration: number
}

export interface GA4PageMetric {
  path: string
  pageviews: number
  users: number
  avgEngagementTime: number
}

export interface GA4TrafficSource {
  source: string
  medium: string
  sessions: number
  users: number
  bounceRate: number
}

export interface GA4ChartPoint {
  date: string
  pageviews: number
  sessions: number
  users: number
}

export class GA4Client {
  private client: BetaAnalyticsDataClient
  private propertyId: string

  constructor(credentialsJson: string, propertyId: string) {
    const credentials = JSON.parse(credentialsJson)
    this.client = new BetaAnalyticsDataClient({ credentials })
    // Ensure propertyId is just the numeric ID
    this.propertyId = propertyId.replace(/^properties\//, '')
  }

  private get property(): string {
    return `properties/${this.propertyId}`
  }

  async getOverview(startDate: string, endDate: string): Promise<GA4Overview> {
    const [response] = await this.client.runReport({
      property: this.property,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
        { name: 'averageSessionDuration' },
      ],
    })

    const row = response.rows?.[0]
    if (!row?.metricValues) {
      return { pageviews: 0, sessions: 0, users: 0, bounceRate: 0, avgSessionDuration: 0 }
    }

    return {
      pageviews: parseInt(row.metricValues[0]?.value || '0'),
      sessions: parseInt(row.metricValues[1]?.value || '0'),
      users: parseInt(row.metricValues[2]?.value || '0'),
      bounceRate: parseFloat(row.metricValues[3]?.value || '0'),
      avgSessionDuration: parseFloat(row.metricValues[4]?.value || '0'),
    }
  }

  async getTopPages(startDate: string, endDate: string, limit = 10): Promise<GA4PageMetric[]> {
    const [response] = await this.client.runReport({
      property: this.property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'totalUsers' },
        { name: 'userEngagementDuration' },
      ],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit,
    })

    return (response.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || '/',
      pageviews: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
      avgEngagementTime: parseFloat(row.metricValues?.[2]?.value || '0'),
    }))
  }

  async getTrafficSources(startDate: string, endDate: string, limit = 10): Promise<GA4TrafficSource[]> {
    const [response] = await this.client.runReport({
      property: this.property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [
        { name: 'sessionSource' },
        { name: 'sessionMedium' },
      ],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'bounceRate' },
      ],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit,
    })

    return (response.rows || []).map((row) => ({
      source: row.dimensionValues?.[0]?.value || '(direct)',
      medium: row.dimensionValues?.[1]?.value || '(none)',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
      users: parseInt(row.metricValues?.[1]?.value || '0'),
      bounceRate: parseFloat(row.metricValues?.[2]?.value || '0'),
    }))
  }

  async getChartData(startDate: string, endDate: string): Promise<GA4ChartPoint[]> {
    const [response] = await this.client.runReport({
      property: this.property,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'totalUsers' },
      ],
      orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    })

    return (response.rows || []).map((row) => ({
      date: row.dimensionValues?.[0]?.value || '',
      pageviews: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      users: parseInt(row.metricValues?.[2]?.value || '0'),
    }))
  }
}
