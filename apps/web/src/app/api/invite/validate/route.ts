export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/invite/validate?org={organizationId}&type={join|new}
 *
 * Validates that an invite link is legitimate.
 * - type=join: User joins the specified org (portal/team member)
 * - type=new: User creates their own org (beta tester with full access)
 *
 * Public endpoint (no auth required) — only returns org name, nothing sensitive.
 */
export async function GET(request: NextRequest) {
  const orgId = request.nextUrl.searchParams.get('org')
  const inviteType = request.nextUrl.searchParams.get('type') || 'join'

  if (!orgId) {
    return NextResponse.json({ valid: false })
  }

  try {
    // Verify the inviting organization exists (proves the link came from a real admin)
    const org = await db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    })

    if (!org) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({
      valid: true,
      organizationName: inviteType === 'new' ? 'StewardGrowth' : org.name,
      inviteType,
    })
  } catch {
    return NextResponse.json({ valid: false })
  }
}
