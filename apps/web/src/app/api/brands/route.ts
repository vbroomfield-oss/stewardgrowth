import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/brands - List all brands for the organization
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Mock data for now - will be replaced with database query
    const brands = [
      {
        id: '1',
        name: 'StewardMAX',
        slug: 'stewardmax',
        domain: 'stewardmax.com',
        color: '#3b82f6',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        name: 'StewardRing',
        slug: 'stewardring',
        domain: 'stewardring.com',
        color: '#22c55e',
        isActive: true,
        createdAt: '2024-01-15T00:00:00Z',
      },
      {
        id: '3',
        name: 'StewardPro',
        slug: 'stewardpro',
        domain: 'stewardpro.io',
        color: '#a855f7',
        isActive: true,
        createdAt: '2024-02-01T00:00:00Z',
      },
    ]

    return NextResponse.json({
      success: true,
      data: brands,
    })
  } catch (error) {
    console.error('Error fetching brands:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch brands' },
      { status: 500 }
    )
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
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
      color,
      brandVoice,
      targetAudiences,
      goals,
      budgetConstraints,
      approvalRules,
    } = body

    // Validate required fields
    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'Name and slug are required' },
        { status: 400 }
      )
    }

    // In production, create in database
    const brand = {
      id: `brand-${Date.now()}`,
      name,
      slug,
      domain,
      color: color || '#6366f1',
      brandVoice: brandVoice || {},
      targetAudiences: targetAudiences || [],
      goals: goals || {},
      budgetConstraints: budgetConstraints || {},
      approvalRules: approvalRules || {
        requireApproval: ['content', 'campaigns', 'budgetChanges'],
        adSpendThreshold: 500,
      },
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: brand,
    })
  } catch (error) {
    console.error('Error creating brand:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create brand' },
      { status: 500 }
    )
  }
}
