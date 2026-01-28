import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export interface UserWithOrg {
  id: string
  supabaseId: string
  email: string
  firstName: string
  lastName: string
  organizationId: string
  organizationName: string
  role: string
}

/**
 * Get the current authenticated user and their default organization.
 * Creates the user and organization if they don't exist (first-time setup).
 */
export async function getUserWithOrganization(): Promise<UserWithOrg | null> {
  console.log('[getUserWithOrganization] Starting...')

  // Debug: Check what cookies are available
  const { cookies } = await import('next/headers')
  const cookieStore = cookies()
  const allCookies = cookieStore.getAll()
  console.log('[getUserWithOrganization] Available cookies:', allCookies.map(c => c.name))

  const supabase = createClient()
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

  console.log('[getUserWithOrganization] Supabase auth result:', {
    hasUser: !!supabaseUser,
    userId: supabaseUser?.id?.slice(0, 8),
    error: error?.message || null,
  })

  if (error || !supabaseUser) {
    console.log('[getUserWithOrganization] No authenticated user')
    return null
  }

  // Try to find existing user
  let user = await db.user.findUnique({
    where: { supabaseId: supabaseUser.id },
    include: {
      organizations: {
        where: { isDefault: true },
        include: { organization: true },
      },
    },
  })

  // If user doesn't exist, create user and default organization
  if (!user) {
    const email = supabaseUser.email || ''
    const firstName = supabaseUser.user_metadata?.first_name || supabaseUser.user_metadata?.name?.split(' ')[0] || 'User'
    const lastName = supabaseUser.user_metadata?.last_name || supabaseUser.user_metadata?.name?.split(' ').slice(1).join(' ') || ''

    // Create organization slug from email domain or name
    const orgSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-org'
    const orgName = `${firstName}'s Organization`

    // Create user with default organization in a transaction
    user = await db.user.create({
      data: {
        supabaseId: supabaseUser.id,
        email,
        firstName,
        lastName,
        avatar: supabaseUser.user_metadata?.avatar_url,
        organizations: {
          create: {
            isDefault: true,
            role: 'OWNER',
            organization: {
              create: {
                name: orgName,
                slug: orgSlug,
              },
            },
          },
        },
      },
      include: {
        organizations: {
          where: { isDefault: true },
          include: { organization: true },
        },
      },
    })
  }

  const defaultOrg = user.organizations[0]

  if (!defaultOrg) {
    // User exists but has no organization - create one
    const orgSlug = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-') + '-org'
    const newOrg = await db.organization.create({
      data: {
        name: `${user.firstName}'s Organization`,
        slug: orgSlug,
        members: {
          create: {
            userId: user.id,
            isDefault: true,
            role: 'OWNER',
          },
        },
      },
    })

    return {
      id: user.id,
      supabaseId: user.supabaseId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      organizationId: newOrg.id,
      organizationName: newOrg.name,
      role: 'OWNER',
    }
  }

  return {
    id: user.id,
    supabaseId: user.supabaseId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    organizationId: defaultOrg.organization.id,
    organizationName: defaultOrg.organization.name,
    role: defaultOrg.role,
  }
}
