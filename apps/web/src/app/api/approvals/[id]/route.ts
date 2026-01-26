export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/approvals/[id] - Get single approval details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // In production, fetch from database
    const approval = {
      id: params.id,
      type: 'CONTENT_PUBLISH',
      status: 'PENDING',
      title: 'Sample Approval',
      description: 'Sample description',
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: approval,
    })
  } catch (error) {
    console.error('Error fetching approval:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval' },
      { status: 500 }
    )
  }
}

// PUT /api/approvals/[id] - Approve or reject
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { action, notes } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    // In production:
    // 1. Update approval status in database
    // 2. If approved, trigger the action (publish content, launch campaign, etc.)
    // 3. Create audit log entry
    // 4. Send notifications

    const auditLog = {
      action: action === 'approve' ? 'APPROVE' : 'REJECT',
      resource: 'ApprovalRequest',
      resourceId: params.id,
      userId: user.id,
      changes: {
        before: { status: 'PENDING' },
        after: { status: newStatus, reviewNotes: notes },
      },
      timestamp: new Date().toISOString(),
    }

    console.log('Audit log:', auditLog)

    return NextResponse.json({
      success: true,
      data: {
        id: params.id,
        status: newStatus,
        reviewerId: user.id,
        reviewedAt: new Date().toISOString(),
        reviewNotes: notes,
      },
      message: `Approval ${action}ed successfully`,
    })
  } catch (error) {
    console.error('Error updating approval:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update approval' },
      { status: 500 }
    )
  }
}
