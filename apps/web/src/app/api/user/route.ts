export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

// GET /api/user - Get current user info
export async function GET() {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: userOrg.id,
        email: userOrg.email,
        firstName: userOrg.firstName,
        lastName: userOrg.lastName,
        organizationId: userOrg.organizationId,
        organizationName: userOrg.organizationName,
        role: userOrg.role,
      },
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    )
  }
}
