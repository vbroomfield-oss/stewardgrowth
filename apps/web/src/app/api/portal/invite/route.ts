export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// POST /api/portal/invite - Invite a brand owner to the portal
export async function POST(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can invite
    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Only admins can send invites' }, { status: 403 })
    }

    const { email, role = 'VIEWER' } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!['VIEWER', 'ANALYST'].includes(role)) {
      return NextResponse.json({ error: 'Invalid portal role' }, { status: 400 })
    }

    // Check if user already exists and is a member
    const existingUser = await db.user.findUnique({
      where: { email },
      include: {
        organizations: {
          where: { organizationId: userOrg.organizationId },
        },
      },
    })

    if (existingUser?.organizations.length) {
      return NextResponse.json({ error: 'User is already a member of this organization' }, { status: 409 })
    }

    // If user exists but not in org, add them
    if (existingUser) {
      await db.organizationMember.create({
        data: {
          userId: existingUser.id,
          organizationId: userOrg.organizationId,
          role: role as any,
          isDefault: false,
        },
      })

      return NextResponse.json({
        success: true,
        message: `${email} has been added to the portal with ${role} access.`,
        existingUser: true,
      })
    }

    // User doesn't exist — generate invite link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'
    const inviteUrl = `${appUrl}/signup?invite=${userOrg.organizationId}&role=${role}`

    return NextResponse.json({
      success: true,
      message: `Send this link to ${email} to invite them to the portal.`,
      inviteUrl,
      email,
      role,
    })
  } catch (error) {
    console.error('[Portal Invite] Error:', error)
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
  }
}
