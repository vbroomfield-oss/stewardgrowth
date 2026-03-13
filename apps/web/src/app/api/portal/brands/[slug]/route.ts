export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// GET /api/portal/brands/[slug] - Get single brand detail for portal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug,
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
        ga4PropertyId: true,
        adPlatformConnections: {
          where: { status: 'CONNECTED' },
          select: { platform: true, accountName: true },
        },
        contentPosts: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            title: true,
            content: true,
            platforms: true,
            status: true,
            scheduledFor: true,
            publishedAt: true,
            createdAt: true,
            aiGenerated: true,
          },
        },
        _count: {
          select: {
            contentPosts: true,
            events: true,
            approvalRequests: true,
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const settings = (brand.settings as Record<string, any>) || {}

    // Build activity from recent content
    const activities = brand.contentPosts.slice(0, 10).map(post => ({
      id: post.id,
      title: post.title || 'Untitled',
      type: post.status === 'PUBLISHED' ? 'published' as const
        : post.status === 'APPROVED' ? 'approved' as const
        : post.status === 'AWAITING_APPROVAL' ? 'created' as const
        : post.status === 'FAILED' ? 'rejected' as const
        : 'scheduled' as const,
      platform: post.platforms[0] || undefined,
      date: (post.publishedAt || post.createdAt).toISOString(),
    }))

    // Count stats
    const publishedPosts = brand.contentPosts.filter(p => p.status === 'PUBLISHED').length
    const scheduledPosts = brand.contentPosts.filter(p => p.status === 'APPROVED').length
    const pendingApprovals = brand.contentPosts.filter(p => p.status === 'AWAITING_APPROVAL').length

    return NextResponse.json({
      success: true,
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        domain: brand.domain,
        color: settings.color || '#6366f1',
        ga4PropertyId: brand.ga4PropertyId,
        connectedPlatforms: brand.adPlatformConnections.map(c => ({
          platform: c.platform,
          accountName: c.accountName,
        })),
        stats: {
          publishedPosts,
          scheduledPosts,
          pendingApprovals,
          totalContent: brand._count.contentPosts,
          totalEvents: brand._count.events,
        },
        recentContent: brand.contentPosts,
        activities,
      },
    })
  } catch (error) {
    console.error('[Portal API] Error fetching brand:', error)
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 })
  }
}
