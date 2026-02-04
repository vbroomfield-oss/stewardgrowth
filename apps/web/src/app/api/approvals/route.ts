export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// GET /api/approvals - List all pending approvals
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'PENDING'
    const brandId = searchParams.get('brandId')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '20')

    // Build where clause
    const where: any = {
      brand: { organizationId: userWithOrg.organizationId },
    }

    if (status && status !== 'ALL') {
      where.status = status
    }
    if (brandId) {
      where.brandId = brandId
    }
    if (type) {
      where.type = type
    }

    // Get total count
    const total = await db.approvalRequest.count({ where })

    // Get approvals with related data
    const approvals = await db.approvalRequest.findMany({
      where,
      include: {
        brand: {
          select: { id: true, name: true, slug: true },
        },
        requester: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewer: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Transform data for frontend
    const data = approvals.map((approval) => ({
      id: approval.id,
      type: approval.type,
      status: approval.status,
      title: approval.title,
      description: approval.description,
      brandId: approval.brandId,
      brandName: approval.brand?.name || 'Unknown',
      resourceType: approval.resourceType,
      resourceId: approval.resourceId,
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
    }))

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
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
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
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
    if (!type || !title || !resourceType || !resourceId || !brandId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, title, resourceType, resourceId, brandId' },
        { status: 400 }
      )
    }

    // Verify user has access to this brand
    const brand = await db.saaSBrand.findFirst({
      where: {
        id: brandId,
        organizationId: userWithOrg.organizationId,
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found or access denied' },
        { status: 404 }
      )
    }

    // Create the approval request
    const approval = await db.approvalRequest.create({
      data: {
        brandId,
        requesterId: userWithOrg.id,
        type: type as any,
        status: 'PENDING',
        title,
        description,
        resourceType,
        resourceId,
        proposedChanges: proposedChanges || {},
        budgetImpact: budgetImpact || 0,
      },
      include: {
        brand: { select: { name: true } },
        requester: { select: { firstName: true, lastName: true } },
      },
    })

    // Create audit log entry
    await db.auditLog.create({
      data: {
        userId: userWithOrg.id,
        organizationId: userWithOrg.organizationId,
        action: 'approval.created',
        resource: 'ApprovalRequest',
        resourceId: approval.id,
        changes: { type, title, resourceType, resourceId },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: approval.id,
        type: approval.type,
        status: approval.status,
        title: approval.title,
        brandName: approval.brand?.name || 'Unknown',
        requesterName: `${approval.requester.firstName} ${approval.requester.lastName}`,
        createdAt: approval.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('Error creating approval:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create approval request' },
      { status: 500 }
    )
  }
}
