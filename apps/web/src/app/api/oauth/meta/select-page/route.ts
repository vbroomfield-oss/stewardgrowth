export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0'

/**
 * POST /api/oauth/meta/select-page
 * Body: { brandId, platform: 'facebook' | 'instagram', pageId }
 * Saves the selected page's token to the AdPlatformConnection
 */
export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { brandId, platform, pageId } = body

    if (!brandId || !platform || !pageId) {
      return NextResponse.json({ error: 'brandId, platform, and pageId are required' }, { status: 400 })
    }

    // Verify brand belongs to user's org
    const brand = await db.saaSBrand.findFirst({
      where: { id: brandId, organizationId: userWithOrg.organizationId },
    })
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Get the platform connection
    const platformEnum = platform === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK'
    const connection = await db.adPlatformConnection.findUnique({
      where: { brandId_platform: { brandId, platform: platformEnum } },
    })

    if (!connection?.credentials) {
      return NextResponse.json({ error: 'No connection found' }, { status: 404 })
    }

    const creds = connection.credentials as any
    const userAccessToken = creds.accessToken

    // Fetch the specific page details + token
    const pagesResponse = await fetch(
      `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${userAccessToken}`
    )

    if (!pagesResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 400 })
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.data || []
    const selectedPage = pages.find((p: any) => p.id === pageId)

    if (!selectedPage) {
      return NextResponse.json({ error: 'Selected page not found' }, { status: 404 })
    }

    if (platform === 'instagram') {
      // For Instagram, find the IG Business Account on this page
      if (!selectedPage.instagram_business_account) {
        return NextResponse.json({ error: 'This page does not have an Instagram Business Account' }, { status: 400 })
      }

      // Get IG account username
      let igUsername = selectedPage.name
      try {
        const igResponse = await fetch(
          `${GRAPH_API_URL}/${selectedPage.instagram_business_account.id}?fields=id,username,name&access_token=${selectedPage.access_token}`
        )
        if (igResponse.ok) {
          const igData = await igResponse.json()
          igUsername = igData.username || igData.name || selectedPage.name
        }
      } catch {
        // Use page name
      }

      await db.adPlatformConnection.update({
        where: { brandId_platform: { brandId, platform: 'INSTAGRAM' } },
        data: {
          credentials: {
            accessToken: userAccessToken,
            pageAccessToken: selectedPage.access_token,
            pageId: selectedPage.id,
            pageName: selectedPage.name,
            connectionType: 'page',
          },
          accountId: selectedPage.instagram_business_account.id,
          accountName: igUsername,
          status: 'CONNECTED',
          lastSyncAt: new Date(),
          lastError: null,
        },
      })

      return NextResponse.json({ success: true, accountName: igUsername, connectionType: 'page' })
    }

    // Facebook page selection
    await db.adPlatformConnection.update({
      where: { brandId_platform: { brandId, platform: 'FACEBOOK' } },
      data: {
        credentials: {
          accessToken: userAccessToken,
          pageAccessToken: selectedPage.access_token,
          pageId: selectedPage.id,
          pageName: selectedPage.name,
          connectionType: 'page',
        },
        accountId: selectedPage.id,
        accountName: selectedPage.name,
        status: 'CONNECTED',
        lastSyncAt: new Date(),
        lastError: null,
      },
    })

    return NextResponse.json({ success: true, accountName: selectedPage.name, connectionType: 'page' })
  } catch (error) {
    console.error('Meta select-page error:', error)
    return NextResponse.json({ error: 'Failed to select page' }, { status: 500 })
  }
}
