export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { createInstagramClient } from '@/lib/social/instagram-client'
import { getOAuthRedirectPath } from '@/lib/oauth/redirect-utils'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/settings?error=instagram_${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=instagram_missing_params', request.url))
    }

    let stateData: { brandId: string; userId: string; timestamp: number; source?: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.redirect(new URL('/settings?error=instagram_invalid_state', request.url))
    }

    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg || userWithOrg.id !== stateData.userId) {
      return NextResponse.redirect(new URL('/login?error=session_expired', request.url))
    }

    const client = createInstagramClient()
    const result = await client.handleCallback(code)

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
      where: { brandId_platform: { brandId: stateData.brandId, platform: 'INSTAGRAM' } },
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
        platform: 'INSTAGRAM',
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
          platform: 'instagram',
          accountName: result.accountName,
          connectionType: result.connectionType,
        },
      },
    })

    const brandForRedirect = await db.saaSBrand.findUnique({ where: { id: stateData.brandId }, select: { slug: true } })
    const redirectSlug = brandForRedirect?.slug || stateData.brandId

    // If multiple IG accounts were returned, redirect to account selector
    const igAccounts = (result as any).igAccounts
    if (igAccounts && igAccounts.length > 1) {
      return NextResponse.redirect(
        new URL(getOAuthRedirectPath({
          source: stateData.source, brandSlug: redirectSlug, platform: 'instagram', result: 'selectPage',
        }), request.url)
      )
    }

    return NextResponse.redirect(
      new URL(getOAuthRedirectPath({
        source: stateData.source, brandSlug: redirectSlug, platform: 'instagram', result: 'success',
      }), request.url)
    )
  } catch (error) {
    console.error('Instagram callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=instagram_callback_failed', request.url))
  }
}
