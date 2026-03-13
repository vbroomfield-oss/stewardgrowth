export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { createFacebookClient } from '@/lib/social/facebook-client'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/settings?error=facebook_${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=facebook_missing_params', request.url))
    }

    let stateData: { brandId: string; userId: string; timestamp: number }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.redirect(new URL('/settings?error=facebook_invalid_state', request.url))
    }

    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg || userWithOrg.id !== stateData.userId) {
      return NextResponse.redirect(new URL('/login?error=session_expired', request.url))
    }

    const client = createFacebookClient()
    const result = await client.handleCallback(code)

    // Store credentials (including pages data for selection later)
    const credentialsToStore: Record<string, any> = {
      accessToken: result.accessToken,
      connectionType: result.connectionType || 'personal',
    }

    if (result.pageAccessToken) {
      credentialsToStore.pageAccessToken = result.pageAccessToken
      credentialsToStore.pageId = result.pageId
      credentialsToStore.pageName = result.pageName
    }

    await db.adPlatformConnection.upsert({
      where: { brandId_platform: { brandId: stateData.brandId, platform: 'FACEBOOK' } },
      update: {
        credentials: credentialsToStore,
        accountId: result.accountId,
        accountName: result.accountName,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        lastError: null,
      },
      create: {
        brandId: stateData.brandId,
        platform: 'FACEBOOK',
        credentials: credentialsToStore,
        accountId: result.accountId,
        accountName: result.accountName,
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
        changes: {
          platform: 'facebook',
          accountName: result.accountName,
          connectionType: result.connectionType,
        },
      },
    })

    // Look up brand slug for redirect
    const brandForRedirect = await db.saaSBrand.findUnique({ where: { id: stateData.brandId }, select: { slug: true } })
    const redirectSlug = brandForRedirect?.slug || stateData.brandId

    // If multiple pages were returned, redirect to page selector
    const pages = (result as any).pages
    if (pages && pages.length > 1) {
      return NextResponse.redirect(
        new URL(`/brands/${redirectSlug}/settings?tab=social&selectPage=facebook`, request.url)
      )
    }

    return NextResponse.redirect(
      new URL(`/brands/${redirectSlug}/settings?tab=social&success=facebook_connected`, request.url)
    )
  } catch (error) {
    console.error('Facebook callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=facebook_callback_failed', request.url))
  }
}
