export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { createLinkedInClient } from '@/lib/social/linkedin-client'

/**
 * GET /api/oauth/linkedin/organizations?brandId={id}
 * Returns LinkedIn organizations the user is admin of
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const brand = await db.saaSBrand.findFirst({
      where: { id: brandId, organizationId: userWithOrg.organizationId },
    })
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const connection = await db.adPlatformConnection.findUnique({
      where: { brandId_platform: { brandId, platform: 'LINKEDIN_ADS' } },
    })

    if (!connection?.credentials) {
      return NextResponse.json({ error: 'No LinkedIn connection found' }, { status: 404 })
    }

    const creds = connection.credentials as any
    const client = createLinkedInClient({ accessToken: creds.accessToken })
    const organizations = await client.getOrganizations(creds.accessToken)

    return NextResponse.json({ success: true, organizations })
  } catch (error) {
    console.error('LinkedIn organizations fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch organizations' }, { status: 500 })
  }
}
