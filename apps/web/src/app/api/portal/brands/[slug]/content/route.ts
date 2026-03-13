export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// GET /api/portal/brands/[slug]/content - Get published/scheduled content for portal
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

    const { searchParams } = new URL(request.url)
    const platform = searchParams.get('platform')
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug,
        deletedAt: null,
      },
      select: { id: true },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const where: any = { brandId: brand.id }

    if (status !== 'all') {
      where.status = status.toUpperCase()
    }

    if (platform) {
      where.platforms = { has: platform }
    }

    const [content, total] = await Promise.all([
      db.contentPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
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
          platformVersions: true,
        },
      }),
      db.contentPost.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      content,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[Portal API] Error fetching content:', error)
    return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
  }
}
