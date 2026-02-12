export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { createTikTokClient } from '@/lib/social/tiktok-client'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/settings?error=tiktok_${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=tiktok_missing_params', request.url))
    }

    let stateData: { brandId: string; userId: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.redirect(new URL('/settings?error=tiktok_invalid_state', request.url))
    }

    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg || userWithOrg.id !== stateData.userId) {
      return NextResponse.redirect(new URL('/login?error=session_expired', request.url))
    }

    const client = createTikTokClient()
    const credentials = await client.handleCallback(code)

    await db.adPlatformConnection.upsert({
      where: { brandId_platform: { brandId: stateData.brandId, platform: 'TIKTOK_ADS' } },
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
        platform: 'TIKTOK_ADS',
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

    await db.auditLog.create({
      data: {
        userId: userWithOrg.id,
        organizationId: userWithOrg.organizationId,
        action: 'platform.connected',
        resource: 'AdPlatformConnection',
        resourceId: stateData.brandId,
        changes: { platform: 'tiktok', accountName: credentials.accountName },
      },
    })

    return NextResponse.redirect(new URL(`/brands/${stateData.brandId}?success=tiktok_connected`, request.url))
  } catch (error) {
    console.error('TikTok callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=tiktok_callback_failed', request.url))
  }
}
