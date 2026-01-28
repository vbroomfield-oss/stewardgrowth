export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

// GET /api/brands/[slug] - Get a single brand by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: params.slug,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        logo: true,
        brandVoice: true,
        targetAudiences: true,
        goals: true,
        budgetConstraints: true,
        approvalRules: true,
        isActive: true,
        settings: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            events: true,
            contentPosts: true,
            adCampaigns: true,
          },
        },
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      brand: {
        ...brand,
        color: (brand.settings as any)?.color || '#6366f1',
        eventsCount: brand._count.events,
        contentCount: brand._count.contentPosts,
        campaignsCount: brand._count.adCampaigns,
      },
    })
  } catch (error) {
    console.error('[API /api/brands/[slug]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brand' },
      { status: 500 }
    )
  }
}

// PATCH /api/brands/[slug] - Update a brand
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const existingBrand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: params.slug,
        deletedAt: null,
      },
    })

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    const updatedBrand = await db.saaSBrand.update({
      where: { id: existingBrand.id },
      data: {
        name: body.name ?? existingBrand.name,
        domain: body.domain ?? existingBrand.domain,
        brandVoice: body.brandVoice ?? existingBrand.brandVoice,
        targetAudiences: body.targetAudiences ?? existingBrand.targetAudiences,
        goals: body.goals ?? existingBrand.goals,
        budgetConstraints: body.budgetConstraints ?? existingBrand.budgetConstraints,
        settings: body.settings ?? existingBrand.settings,
      },
    })

    return NextResponse.json({
      success: true,
      brand: updatedBrand,
    })
  } catch (error) {
    console.error('[API /api/brands/[slug]] Update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update brand' },
      { status: 500 }
    )
  }
}

// DELETE /api/brands/[slug] - Soft delete a brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const existingBrand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: params.slug,
        deletedAt: null,
      },
    })

    if (!existingBrand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    await db.saaSBrand.update({
      where: { id: existingBrand.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully',
    })
  } catch (error) {
    console.error('[API /api/brands/[slug]] Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete brand' },
      { status: 500 }
    )
  }
}
