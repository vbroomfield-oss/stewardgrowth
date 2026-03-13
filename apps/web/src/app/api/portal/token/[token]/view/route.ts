export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/portal/token/[token]/view - Public endpoint to view brand via token
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const portalToken = await db.portalToken.findUnique({
      where: { token },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            domain: true,
            settings: true,
            isActive: true,
            deletedAt: true,
            adPlatformConnections: {
              where: { status: 'CONNECTED' },
              select: { platform: true },
            },
            contentPosts: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                title: true,
                platforms: true,
                status: true,
                createdAt: true,
              },
            },
            _count: {
              select: { contentPosts: true },
            },
          },
        },
      },
    })

    if (!portalToken || !portalToken.isActive) {
      return NextResponse.json({ error: 'Invalid or revoked link' }, { status: 404 })
    }

    if (portalToken.expiresAt && new Date() > portalToken.expiresAt) {
      return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
    }

    if (!portalToken.brand || portalToken.brand.deletedAt || !portalToken.brand.isActive) {
      return NextResponse.json({ error: 'Brand no longer available' }, { status: 404 })
    }

    // Update last used timestamp
    await db.portalToken.update({
      where: { id: portalToken.id },
      data: { lastUsedAt: new Date() },
    })

    const brand = portalToken.brand
    const settings = (brand.settings as Record<string, any>) || {}

    const publishedPosts = brand.contentPosts.filter(p => p.status === 'PUBLISHED').length
    const scheduledPosts = brand.contentPosts.filter(p => p.status === 'APPROVED').length
    const pendingApprovals = brand.contentPosts.filter(p => p.status === 'AWAITING_APPROVAL').length

    return NextResponse.json({
      success: true,
      brand: {
        name: brand.name,
        slug: brand.slug,
        logo: brand.logo,
        color: settings.color || '#6366f1',
        domain: brand.domain,
        connectedPlatforms: brand.adPlatformConnections.map(c => c.platform),
        stats: {
          publishedPosts,
          scheduledPosts,
          pendingApprovals,
          totalContent: brand._count.contentPosts,
        },
        recentContent: brand.contentPosts,
      },
    })
  } catch (error) {
    console.error('[Portal Token View] Error:', error)
    return NextResponse.json({ error: 'Failed to load brand data' }, { status: 500 })
  }
}
