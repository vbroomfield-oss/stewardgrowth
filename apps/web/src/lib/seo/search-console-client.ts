import { google } from 'googleapis'

export interface SearchAnalyticsRow {
  keyword?: string
  page?: string
  country?: string
  device?: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export class SearchConsoleClient {
  private auth: any
  private siteUrl: string

  constructor(credentialsJson: string, siteUrl: string) {
    const credentials = JSON.parse(credentialsJson)
    this.auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
    // Ensure siteUrl is properly formatted
    this.siteUrl = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`
  }

  async getTopKeywords(startDate: string, endDate: string, limit = 50): Promise<SearchAnalyticsRow[]> {
    const searchconsole = google.searchconsole({ version: 'v1', auth: this.auth })

    const response = await searchconsole.searchanalytics.query({
      siteUrl: this.siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: limit,
        type: 'web',
      },
    })

    return (response.data.rows || []).map((row) => ({
      keyword: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  async getTopPages(startDate: string, endDate: string, limit = 50): Promise<SearchAnalyticsRow[]> {
    const searchconsole = google.searchconsole({ version: 'v1', auth: this.auth })

    const response = await searchconsole.searchanalytics.query({
      siteUrl: this.siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: limit,
        type: 'web',
      },
    })

    return (response.data.rows || []).map((row) => ({
      page: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }

  async getKeywordsByPage(page: string, startDate: string, endDate: string, limit = 20): Promise<SearchAnalyticsRow[]> {
    const searchconsole = google.searchconsole({ version: 'v1', auth: this.auth })

    const response = await searchconsole.searchanalytics.query({
      siteUrl: this.siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        dimensionFilterGroups: [{
          filters: [{ dimension: 'page', expression: page, operator: 'equals' }],
        }],
        rowLimit: limit,
        type: 'web',
      },
    })

    return (response.data.rows || []).map((row) => ({
      keyword: row.keys?.[0] || '',
      clicks: row.clicks || 0,
      impressions: row.impressions || 0,
      ctr: row.ctr || 0,
      position: row.position || 0,
    }))
  }
}
