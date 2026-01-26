import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/approvals - List all pending approvals
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

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const brandId = searchParams.get('brandId')
    const type = searchParams.get('type')

    // For now, return mock data
    // In production, this would query the database
    const mockApprovals = [
      {
        id: '1',
        type: 'CONTENT_PUBLISH',
        status: 'PENDING',
        title: 'LinkedIn post: "5 Ways AI Transforms Church Management"',
        description: 'AI-generated content for weekly social campaign',
        brandId: 'stewardmax',
        brandName: 'StewardMAX',
        resourceType: 'ContentPost',
        resourceId: 'post-123',
        proposedChanges: {
          content: 'Full post content here...',
          platforms: ['linkedin'],
          scheduledFor: '2024-02-01T10:00:00Z',
        },
        requesterId: 'ai-engine',
        requesterName: 'AI Content Engine',
        createdAt: new Date().toISOString(),
      },
    ]

    return NextResponse.json({
      success: true,
      data: mockApprovals,
      pagination: {
        total: mockApprovals.length,
        page: 1,
        pageSize: 20,
      },
    })
  } catch (error) {
    console.error('Error fetching approvals:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approvals' },
      { status: 500 }
    )
  }
}

// POST /api/approvals - Create a new approval request
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
      type,
      title,
      description,
      brandId,
      resourceType,
      resourceId,
      proposedChanges,
      budgetImpact,
    } = body

    // Validate required fields
    if (!type || !title || !resourceType || !resourceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In production, this would create a record in the database
    const approval = {
      id: `approval-${Date.now()}`,
      type,
      status: 'PENDING',
      title,
      description,
      brandId,
      resourceType,
      resourceId,
      proposedChanges,
      budgetImpact,
      requesterId: user.id,
      createdAt: new Date().toISOString(),
    }

    // Log for audit trail
    console.log('Approval request created:', approval)

    return NextResponse.json({
      success: true,
      data: approval,
    })
  } catch (error) {
    console.error('Error creating approval:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create approval request' },
      { status: 500 }
    )
  }
}
