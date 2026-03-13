export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { SearchConsoleClient } from '@/lib/seo/search-console-client'

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
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  }
}

/**
 * GET /api/seo/search-console?dimension=query|page&range=30d&limit=50
 * Returns Google Search Console data
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dimension = searchParams.get('dimension') || 'query'
    const range = searchParams.get('range') || '30d'
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get org settings for credentials and site URL
    const org = await db.organization.findUnique({
      where: { id: userWithOrg.organizationId },
      select: { settings: true },
    })

    const settings = (org?.settings as Record<string, any>) || {}
    const credentialsJson = settings.GOOGLE_ANALYTICS_API_CREDENTIALS
    const siteUrl = settings.GOOGLE_SEARCH_CONSOLE_SITE_URL

    if (!credentialsJson) {
      return NextResponse.json({
        error: 'Google API credentials not configured. Add service account JSON in Settings > Integrations.',
      }, { status: 400 })
    }

    if (!siteUrl) {
      return NextResponse.json({
        error: 'Google Search Console site URL not configured. Add it in Settings > Integrations.',
      }, { status: 400 })
    }

    const client = new SearchConsoleClient(credentialsJson, siteUrl)
    const { startDate, endDate } = getDateRange(range)

    let data
    if (dimension === 'page') {
      data = await client.getTopPages(startDate, endDate, limit)
    } else {
      data = await client.getTopKeywords(startDate, endDate, limit)
    }

    // Calculate summary stats
    const totalClicks = data.reduce((sum, row) => sum + row.clicks, 0)
    const totalImpressions = data.reduce((sum, row) => sum + row.impressions, 0)
    const avgPosition = data.length > 0
      ? data.reduce((sum, row) => sum + row.position, 0) / data.length
      : 0
    const avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0

    return NextResponse.json({
      success: true,
      dimension,
      range,
      summary: {
        totalKeywords: data.length,
        totalClicks,
        totalImpressions,
        avgPosition: Math.round(avgPosition * 10) / 10,
        avgCtr: Math.round(avgCtr * 10000) / 100, // percentage
      },
      data,
    })
  } catch (error) {
    console.error('Search Console API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Search Console data. Check credentials and site URL.' },
      { status: 500 }
    )
  }
}
