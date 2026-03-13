export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

/**
 * POST /api/oauth/linkedin/select-org
 * Body: { brandId, organizationId, organizationName }
 * Updates the LinkedIn connection to post as the selected organization
 */
export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brandId, organizationId, organizationName } = body

    if (!brandId || !organizationId) {
      return NextResponse.json({ error: 'brandId and organizationId are required' }, { status: 400 })
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

    await db.adPlatformConnection.update({
      where: { brandId_platform: { brandId, platform: 'LINKEDIN_ADS' } },
      data: {
        credentials: {
          ...creds,
          organizationId,
          organizationName,
          connectionType: 'organization',
        },
        accountId: organizationId,
        accountName: organizationName || `Organization ${organizationId}`,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        lastError: null,
      },
    })

    return NextResponse.json({
      success: true,
      accountName: organizationName,
      connectionType: 'organization',
    })
  } catch (error) {
    console.error('LinkedIn select-org error:', error)
    return NextResponse.json({ error: 'Failed to select organization' }, { status: 500 })
  }
}
