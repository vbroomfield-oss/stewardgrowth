import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/auth/me - Get current user info
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // In production, fetch additional user data from database
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name || 'User',
      lastName: user.user_metadata?.last_name || '',
      avatar: user.user_metadata?.avatar_url,
      createdAt: user.created_at,
      // Organization data would come from database
      organization: {
        id: 'org-1',
        name: 'Steward SaaS',
        slug: 'steward-saas',
        role: 'OWNER',
      },
    }

    return NextResponse.json({
      success: true,
      data: userData,
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user data' },
      { status: 500 }
    )
  }
}
