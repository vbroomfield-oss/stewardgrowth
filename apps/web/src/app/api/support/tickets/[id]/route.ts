export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

/**
 * GET /api/support/tickets/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserWithOrganization()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ticket = await db.supportTicket.findFirst({
    where: {
      id: params.id,
      organizationId: user.organizationId,
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true, avatar: true },
      },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  return NextResponse.json({ ticket })
}

/**
 * PATCH /api/support/tickets/[id]
 * Update ticket (status, response, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getUserWithOrganization()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ticket = await db.supportTicket.findFirst({
    where: {
      id: params.id,
      organizationId: user.organizationId,
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  const body = await request.json()
  const updateData: Record<string, unknown> = {}

  // Anyone can update their own ticket's title/description
  if (ticket.userId === user.id) {
    if (body.title) updateData.title = body.title
    if (body.description) updateData.description = body.description
    if (body.stepsToReproduce !== undefined) updateData.stepsToReproduce = body.stepsToReproduce
  }

  // Admins can update status and respond
  if (['OWNER', 'ADMIN'].includes(user.role)) {
    if (body.status) {
      updateData.status = body.status
      if (body.status === 'RESOLVED' || body.status === 'CLOSED') {
        updateData.resolvedAt = new Date()
        updateData.resolvedById = user.id
      }
    }
    if (body.response) {
      updateData.response = body.response
      updateData.respondedAt = new Date()
    }
    if (body.severity) updateData.severity = body.severity
    if (body.category) updateData.category = body.category
  }

  const updated = await db.supportTicket.update({
    where: { id: params.id },
    data: updateData,
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  })

  return NextResponse.json({ ticket: updated })
}
