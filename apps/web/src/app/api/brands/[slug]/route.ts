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
      include: {
        _count: {
          select: {
            events: true,
            contentPosts: true,
            adCampaigns: true,
            kpiSnapshots: true,
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

    // Get recent KPI snapshot if available
    const latestKpi = await db.kPISnapshot.findFirst({
      where: { brandId: brand.id },
      orderBy: { createdAt: 'desc' },
    })

    const settings = brand.settings as any || {}

    return NextResponse.json({
      success: true,
      data: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        domain: brand.domain,
        logo: brand.logo,
        brandVoice: brand.brandVoice,
        targetAudiences: brand.targetAudiences,
        goals: brand.goals,
        budgetConstraints: brand.budgetConstraints,
        approvalRules: brand.approvalRules,
        isActive: brand.isActive,
        settings: brand.settings,
        createdAt: brand.createdAt.toISOString(),
        updatedAt: brand.updatedAt.toISOString(),
        // Extracted fields
        color: settings.color || '#6366f1',
        description: settings.description || '',
        industry: settings.industry || '',
        trackingId: settings.tracking?.trackingId || null,
        apiKey: settings.tracking?.apiKey || null,
        domains: settings.domains || {},
        // Counts
        counts: {
          events: brand._count.events,
          content: brand._count.contentPosts,
          campaigns: brand._count.adCampaigns,
          kpiSnapshots: brand._count.kpiSnapshots,
        },
        // Latest metrics (from KPI or defaults)
        metrics: latestKpi ? {
          mrr: Number(latestKpi.mrr),
          leads: latestKpi.leads,
          trials: latestKpi.trials,
          adSpend: Number(latestKpi.totalAdSpend),
          pageViews: latestKpi.pageViews,
          visitors: latestKpi.uniqueVisitors,
        } : {
          mrr: 0,
          leads: 0,
          trials: 0,
          adSpend: 0,
          pageViews: 0,
          visitors: 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching brand:', error)
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

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: params.slug,
        deletedAt: null,
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const {
      name,
      domain,
      description,
      industry,
      color,
      brandVoice,
      targetAudiences,
      goals,
      budgetConstraints,
      approvalRules,
      timezone,
      currency,
    } = body

    // Build update data
    const currentSettings = (brand.settings as any) || {}
    const updatedSettings = {
      ...currentSettings,
      ...(color && { color }),
      ...(description !== undefined && { description }),
      ...(industry !== undefined && { industry }),
      ...(timezone && { timezone }),
      ...(currency && { currency }),
    }

    const updatedBrand = await db.saaSBrand.update({
      where: { id: brand.id },
      data: {
        ...(name && { name }),
        ...(domain && { domain }),
        ...(brandVoice && { brandVoice }),
        ...(targetAudiences && { targetAudiences }),
        ...(goals && { goals }),
        ...(budgetConstraints && { budgetConstraints }),
        ...(approvalRules && { approvalRules }),
        settings: updatedSettings,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedBrand.id,
        name: updatedBrand.name,
        slug: updatedBrand.slug,
        updatedAt: updatedBrand.updatedAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error updating brand:', error)
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

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: params.slug,
        deletedAt: null,
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Soft delete
    await db.saaSBrand.update({
      where: { id: brand.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: 'Brand deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting brand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete brand' },
      { status: 500 }
    )
  }
}
