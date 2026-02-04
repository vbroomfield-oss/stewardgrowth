export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

/**
 * GET /api/platforms
 * Get all platform connections for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    // Build where clause
    const where: any = {
      brand: { organizationId: userWithOrg.organizationId },
    }

    if (brandId) {
      where.brandId = brandId
    }

    const connections = await db.adPlatformConnection.findMany({
      where,
      include: {
        brand: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Transform to friendly format
    const platforms = connections.map((conn) => ({
      id: conn.id,
      brandId: conn.brandId,
      brandName: conn.brand.name,
      platform: conn.platform.toLowerCase().replace('_ads', ''),
      status: conn.status,
      accountName: conn.accountName,
      accountId: conn.accountId,
      lastSyncAt: conn.lastSyncAt?.toISOString(),
      lastError: conn.lastError,
      createdAt: conn.createdAt.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: platforms,
    })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/platforms
 * Disconnect a platform
 */
export async function DELETE(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('id')

    if (!connectionId) {
      return NextResponse.json(
        { success: false, error: 'Connection ID required' },
        { status: 400 }
      )
    }

    // Verify ownership
    const connection = await db.adPlatformConnection.findFirst({
      where: {
        id: connectionId,
        brand: { organizationId: userWithOrg.organizationId },
      },
    })

    if (!connection) {
      return NextResponse.json(
        { success: false, error: 'Connection not found' },
        { status: 404 }
      )
    }

    // Update to disconnected
    await db.adPlatformConnection.update({
      where: { id: connectionId },
      data: {
        status: 'DISCONNECTED',
        credentials: {},
      },
    })

    // Audit log
    await db.auditLog.create({
      data: {
        userId: userWithOrg.id,
        organizationId: userWithOrg.organizationId,
        action: 'platform.disconnected',
        resource: 'AdPlatformConnection',
        resourceId: connectionId,
        changes: { platform: connection.platform },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Platform disconnected',
    })
  } catch (error) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
}
