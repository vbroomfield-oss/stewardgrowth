export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { createLinkedInClient } from '@/lib/social/linkedin-client'
import { db } from '@/lib/db'

/**
 * GET /api/oauth/linkedin/callback
 * Handles LinkedIn OAuth callback
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // Handle OAuth errors
    if (error) {
      console.error('LinkedIn OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/settings?error=linkedin_${error}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings?error=linkedin_missing_params', request.url)
      )
    }

    // Decode state
    let stateData: { brandId: string; userId: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.redirect(
        new URL('/settings?error=linkedin_invalid_state', request.url)
      )
    }

    // Verify user
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg || userWithOrg.id !== stateData.userId) {
      return NextResponse.redirect(
        new URL('/login?error=session_expired', request.url)
      )
    }

    // Exchange code for tokens
    const client = createLinkedInClient()
    const credentials = await client.handleCallback(code)

    // Save connection to database
    await db.adPlatformConnection.upsert({
      where: {
        brandId_platform: {
          brandId: stateData.brandId,
          platform: 'LINKEDIN_ADS', // Using the existing enum
        },
      },
      update: {
        credentials: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt?.toISOString(),
        },
        accountId: credentials.accountId,
        accountName: credentials.accountName,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        lastError: null,
      },
      create: {
        brandId: stateData.brandId,
        platform: 'LINKEDIN_ADS',
        credentials: {
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          expiresAt: credentials.expiresAt?.toISOString(),
        },
        accountId: credentials.accountId,
        accountName: credentials.accountName,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
      },
    })

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: userWithOrg.id,
        organizationId: userWithOrg.organizationId,
        action: 'platform.connected',
        resourceType: 'AdPlatformConnection',
        resourceId: stateData.brandId,
        changes: {
          platform: 'linkedin',
          accountName: credentials.accountName,
        },
      },
    })

    return NextResponse.redirect(
      new URL(`/brands/${stateData.brandId}?success=linkedin_connected`, request.url)
    )
  } catch (error) {
    console.error('LinkedIn callback error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=linkedin_callback_failed', request.url)
    )
  }
}
