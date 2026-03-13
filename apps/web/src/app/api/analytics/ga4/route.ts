export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { GA4Client } from '@/lib/analytics/ga4-client'

function getDateRange(range: string): { startDate: string; endDate: string } {
  const endDate = 'today'
  switch (range) {
    case '7d': return { startDate: '7daysAgo', endDate }
    case '90d': return { startDate: '90daysAgo', endDate }
    case '30d':
    default: return { startDate: '30daysAgo', endDate }
  }
}

/**
 * GET /api/analytics/ga4?brandId={slug}&range=7d|30d|90d
 * Returns real GA4 analytics data for a brand
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandSlug = searchParams.get('brandId')
    const range = searchParams.get('range') || '30d'

    if (!brandSlug) {
      return NextResponse.json({ error: 'brandId (slug) is required' }, { status: 400 })
    }

    // Find brand and verify ownership
    const brand = await db.saaSBrand.findFirst({
      where: {
        slug: brandSlug,
        organizationId: userWithOrg.organizationId,
      },
      select: { id: true, name: true, ga4PropertyId: true },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    if (!brand.ga4PropertyId) {
      return NextResponse.json({
        error: 'No GA4 property configured for this brand. Add it in Brand Settings > API Keys.',
      }, { status: 404 })
    }

    // Get service account credentials from org settings
    const org = await db.organization.findUnique({
      where: { id: userWithOrg.organizationId },
      select: { settings: true },
    })

    const settings = (org?.settings as Record<string, any>) || {}
    const credentialsJson = settings.GOOGLE_ANALYTICS_API_CREDENTIALS

    if (!credentialsJson) {
      return NextResponse.json({
        error: 'Google Analytics API credentials not configured. Add service account JSON in Settings > Integrations.',
      }, { status: 400 })
    }

    const client = new GA4Client(credentialsJson, brand.ga4PropertyId)
    const { startDate, endDate } = getDateRange(range)

    const [overview, topPages, trafficSources, chartData] = await Promise.all([
      client.getOverview(startDate, endDate),
      client.getTopPages(startDate, endDate, 10),
      client.getTrafficSources(startDate, endDate, 10),
      client.getChartData(startDate, endDate),
    ])

    return NextResponse.json({
      success: true,
      brandName: brand.name,
      range,
      overview,
      topPages,
      trafficSources,
      chartData,
    })
  } catch (error) {
    console.error('GA4 API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch GA4 data. Check credentials and property ID.' },
      { status: 500 }
    )
  }
}
