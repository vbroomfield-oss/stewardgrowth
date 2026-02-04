export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// GET /api/approvals/[id] - Get single approval details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const approval = await db.approvalRequest.findFirst({
      where: {
        id: params.id,
        brand: { organizationId: userWithOrg.organizationId },
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewer: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    })

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      )
    }

    // If this is a content approval, fetch the content
    let resourceData = null
    if (approval.resourceType === 'ContentPost' && approval.resourceId) {
      resourceData = await db.contentPost.findUnique({
        where: { id: approval.resourceId },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: approval.id,
        type: approval.type,
        status: approval.status,
        title: approval.title,
        description: approval.description,
        brandId: approval.brandId,
        brandName: approval.brand?.name || 'Unknown',
        resourceType: approval.resourceType,
        resourceId: approval.resourceId,
        resourceData,
        proposedChanges: approval.proposedChanges,
        budgetImpact: approval.budgetImpact,
        requesterId: approval.requesterId,
        requesterName: approval.requester
          ? `${approval.requester.firstName} ${approval.requester.lastName}`
          : 'AI Engine',
        reviewerId: approval.reviewerId,
        reviewerName: approval.reviewer
          ? `${approval.reviewer.firstName} ${approval.reviewer.lastName}`
          : null,
        reviewNotes: approval.reviewNotes,
        createdAt: approval.createdAt.toISOString(),
        reviewedAt: approval.reviewedAt?.toISOString() || null,
      },
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
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, notes, scheduledFor } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    // Find the approval
    const approval = await db.approvalRequest.findFirst({
      where: {
        id: params.id,
        brand: { organizationId: userWithOrg.organizationId },
      },
    })

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      )
    }

    if (approval.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Approval has already been processed' },
        { status: 400 }
      )
    }

    const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

    // Update the approval request
    const updatedApproval = await db.approvalRequest.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        reviewerId: userWithOrg.id,
        reviewedAt: new Date(),
        reviewNotes: notes,
      },
    })

    // If approved and it's a content approval, update the content status
    if (action === 'approve' && approval.resourceType === 'ContentPost' && approval.resourceId) {
      await db.contentPost.update({
        where: { id: approval.resourceId },
        data: {
          status: 'APPROVED',
          approvalId: approval.id,
          // Update scheduled time if provided
          ...(scheduledFor && { scheduledFor: new Date(scheduledFor) }),
        },
      })
    }

    // If rejected and it's a content approval, mark content as draft
    if (action === 'reject' && approval.resourceType === 'ContentPost' && approval.resourceId) {
      await db.contentPost.update({
        where: { id: approval.resourceId },
        data: {
          status: 'DRAFT',
          approvalId: approval.id,
        },
      })
    }

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: userWithOrg.id,
        organizationId: userWithOrg.organizationId,
        action: `approval.${action}`,
        resource: 'ApprovalRequest',
        resourceId: params.id,
        changes: {
          before: { status: 'PENDING' },
          after: { status: newStatus, reviewNotes: notes },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: updatedApproval.id,
        status: updatedApproval.status,
        reviewerId: updatedApproval.reviewerId,
        reviewedAt: updatedApproval.reviewedAt?.toISOString(),
        reviewNotes: updatedApproval.reviewNotes,
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
