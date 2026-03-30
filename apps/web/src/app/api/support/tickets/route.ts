export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

/**
 * GET /api/support/tickets
 * List tickets for the current user's organization
 */
export async function GET(request: NextRequest) {
  const user = await getUserWithOrganization()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = request.nextUrl.searchParams.get('status')
  const category = request.nextUrl.searchParams.get('category')

  const where: Record<string, unknown> = {
    organizationId: user.organizationId,
  }

  // Non-admin users only see their own tickets
  if (!['OWNER', 'ADMIN'].includes(user.role)) {
    where.userId = user.id
  }

  if (status && status !== 'all') {
    where.status = status
  }
  if (category && category !== 'all') {
    where.category = category
  }

  const tickets = await db.supportTicket.findMany({
    where,
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true, avatar: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ tickets })
}

/**
 * POST /api/support/tickets
 * Create a new support ticket
 */
export async function POST(request: NextRequest) {
  const user = await getUserWithOrganization()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { title, description, category, severity, featureArea, stepsToReproduce } = body

  if (!title || !description || !category) {
    return NextResponse.json(
      { error: 'Title, description, and category are required' },
      { status: 400 }
    )
  }

  const ticket = await db.supportTicket.create({
    data: {
      organizationId: user.organizationId,
      userId: user.id,
      title,
      description,
      category,
      severity: severity || 'MEDIUM',
      featureArea: featureArea || null,
      stepsToReproduce: stepsToReproduce || null,
    },
    include: {
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  })

  return NextResponse.json({ ticket }, { status: 201 })
}
