export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// GET /api/portal/brands - Get all brands for portal user with summary stats
export async function GET() {
  try {
    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        domain: true,
        settings: true,
        _count: {
          select: {
            contentPosts: true,
          },
        },
        adPlatformConnections: {
          where: { status: 'CONNECTED' },
          select: { platform: true },
        },
        contentPosts: {
          where: { status: { in: ['PUBLISHED', 'APPROVED', 'AWAITING_APPROVAL'] } },
          select: { status: true },
        },
      },
    })

    const brandsWithStats = brands.map(brand => {
      const settings = (brand.settings as Record<string, any>) || {}
      const published = brand.contentPosts.filter(p => p.status === 'PUBLISHED').length
      const scheduled = brand.contentPosts.filter(p => p.status === 'APPROVED').length
      const pending = brand.contentPosts.filter(p => p.status === 'AWAITING_APPROVAL').length

      return {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        domain: brand.domain,
        color: settings.color || '#6366f1',
        connectedPlatforms: brand.adPlatformConnections.map(c => c.platform),
        stats: {
          publishedPosts: published,
          scheduledPosts: scheduled,
          pendingApprovals: pending,
          totalContent: brand._count.contentPosts,
        },
      }
    })

    return NextResponse.json({ success: true, brands: brandsWithStats })
  } catch (error) {
    console.error('[Portal API] Error fetching brands:', error)
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 })
  }
}
