export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import crypto from 'crypto'

// Generate a secure API key for the brand
function generateApiKey(): string {
  return `sg_${crypto.randomBytes(24).toString('base64url')}`
}

// Generate a tracking ID for the brand
function generateTrackingId(): string {
  return `SG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

// GET /api/brands - List all brands for the user's organization
export async function GET(request: NextRequest) {
  try {
    console.log('[API /api/brands] Starting request...')

    const userOrg = await getUserWithOrganization()
    console.log('[API /api/brands] userOrg:', userOrg ? 'found' : 'null')

    if (!userOrg) {
      console.log('[API /api/brands] Unauthorized - no user session')
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch brands from database
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
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
        // Include counts for display
        _count: {
          select: {
            events: true,
            contentPosts: true,
            adCampaigns: true,
          },
        },
      },
    })

    // Transform for API response
    const transformedBrands = brands.map((brand) => ({
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
      // Extract color from settings or use default
      color: (brand.settings as any)?.color || '#6366f1',
      // Include counts
      eventsCount: brand._count.events,
      contentCount: brand._count.contentPosts,
      campaignsCount: brand._count.adCampaigns,
    }))

    return NextResponse.json({
      success: true,
      brands: transformedBrands,
    })
  } catch (error) {
    console.error('[API /api/brands] Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Failed to fetch brands: ${errorMessage}` },
      { status: 500 }
    )
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      slug,
      domain,
      description,
      industry,
      // Domains
      primaryDomain,
      appDomain,
      marketingSite,
      landingPages,
      // Brand Voice
      tone,
      personality,
      tagline,
      keywords,
      avoidWords,
      // Audiences
      audiences,
      // Budget
      monthlyBudget,
      dailyMax,
      googleBudget,
      metaBudget,
      linkedinBudget,
      // Other
      color,
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // Check if slug already exists for this organization
    const existingBrand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: slug.toLowerCase(),
        deletedAt: null,
      },
    })

    if (existingBrand) {
      return NextResponse.json(
        { success: false, error: 'A brand with this slug already exists' },
        { status: 400 }
      )
    }

    // Generate tracking credentials
    const apiKey = generateApiKey()
    const trackingId = generateTrackingId()

    // Create the brand
    const brand = await db.saaSBrand.create({
      data: {
        organizationId: userOrg.organizationId,
        name,
        slug: slug.toLowerCase(),
        domain: primaryDomain || domain,
        brandVoice: {
          tone: tone || 'professional',
          personality: personality || '',
          tagline: tagline || '',
          keywords: keywords ? keywords.split(',').map((k: string) => k.trim()) : [],
          avoidWords: avoidWords ? avoidWords.split(',').map((w: string) => w.trim()) : [],
        },
        targetAudiences: audiences || [],
        goals: {
          monthly: {
            leads: 100,
            trials: 25,
            revenue: monthlyBudget ? parseInt(monthlyBudget) * 10 : 50000,
          },
        },
        budgetConstraints: {
          monthly: monthlyBudget ? parseInt(monthlyBudget) : 5000,
          dailyMax: dailyMax ? parseInt(dailyMax) : 200,
          platforms: {
            google: googleBudget ? parseInt(googleBudget) : 2000,
            meta: metaBudget ? parseInt(metaBudget) : 1500,
            linkedin: linkedinBudget ? parseInt(linkedinBudget) : 500,
          },
        },
        approvalRules: {
          requireApproval: ['content', 'campaigns', 'budgetChanges'],
          adSpendThreshold: 500,
        },
        settings: {
          color: color || '#6366f1',
          description: description || '',
          industry: industry || '',
          domains: {
            primary: primaryDomain || '',
            app: appDomain || '',
            marketing: marketingSite || '',
            landing: landingPages || [],
          },
          tracking: {
            apiKey,
            trackingId,
          },
        },
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        domain: brand.domain,
        trackingId,
        apiKey,
        createdAt: brand.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}
