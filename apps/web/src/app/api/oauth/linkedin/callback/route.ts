export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { createLinkedInClient } from '@/lib/social/linkedin-client'
import { getOAuthRedirectPath } from '@/lib/oauth/redirect-utils'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/settings?error=linkedin_${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings?error=linkedin_missing_params', request.url))
    }

    let stateData: { brandId: string; userId: string; timestamp: number; source?: string }
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf-8'))
    } catch {
      return NextResponse.redirect(new URL('/settings?error=linkedin_invalid_state', request.url))
    }

    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg || userWithOrg.id !== stateData.userId) {
      return NextResponse.redirect(new URL('/login?error=session_expired', request.url))
    }

    const client = createLinkedInClient()
    const result = await client.handleCallback(code)

    const credentialsToStore: Record<string, any> = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresAt: result.expiresAt?.toISOString(),
      connectionType: result.connectionType || 'personal',
    }

    if (result.organizationId) {
      credentialsToStore.organizationId = result.organizationId
      credentialsToStore.organizationName = result.organizationName
    }

    await db.adPlatformConnection.upsert({
      where: {
        brandId_platform: {
          brandId: stateData.brandId,
          platform: 'LINKEDIN_ADS',
        },
      },
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
        platform: 'LINKEDIN_ADS',
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
          platform: 'linkedin',
          accountName: result.accountName,
          connectionType: result.connectionType,
        },
      },
    })

    const brandForRedirect = await db.saaSBrand.findUnique({ where: { id: stateData.brandId }, select: { slug: true } })
    const redirectSlug = brandForRedirect?.slug || stateData.brandId

    // If multiple organizations were returned, redirect to org selector
    const organizations = (result as any).organizations
    if (organizations && organizations.length > 1) {
      return NextResponse.redirect(
        new URL(getOAuthRedirectPath({
          source: stateData.source, brandSlug: redirectSlug, platform: 'linkedin', result: 'selectOrg',
        }), request.url)
      )
    }

    return NextResponse.redirect(
      new URL(getOAuthRedirectPath({
        source: stateData.source, brandSlug: redirectSlug, platform: 'linkedin', result: 'success',
      }), request.url)
    )
  } catch (error) {
    console.error('LinkedIn callback error:', error)
    return NextResponse.redirect(new URL('/settings?error=linkedin_callback_failed', request.url))
  }
}
