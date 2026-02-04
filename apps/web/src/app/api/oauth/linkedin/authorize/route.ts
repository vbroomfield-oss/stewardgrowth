export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { createLinkedInClient } from '@/lib/social/linkedin-client'
import { db } from '@/lib/db'

/**
 * GET /api/oauth/linkedin/authorize
 * Initiates LinkedIn OAuth flow
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: 'brandId is required' },
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
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Create state parameter with brand info (for callback)
    const state = Buffer.from(
      JSON.stringify({
        brandId,
        userId: userWithOrg.id,
        timestamp: Date.now(),
      })
    ).toString('base64')

    const client = createLinkedInClient()
    const authUrl = client.getAuthUrl(state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('LinkedIn OAuth error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to initiate OAuth' },
      { status: 500 }
    )
  }
}
