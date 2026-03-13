export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

const GRAPH_API_URL = 'https://graph.facebook.com/v18.0'

/**
 * GET /api/oauth/meta/pages?brandId={id}&platform=facebook|instagram
 * Returns Facebook Pages (and optionally their IG Business Accounts) for page selection
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')
    const platform = searchParams.get('platform') || 'facebook'

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    // Verify brand belongs to user's org
    const brand = await db.saaSBrand.findFirst({
      where: { id: brandId, organizationId: userWithOrg.organizationId },
    })
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    // Get the platform connection to read stored user token
    const platformEnum = platform === 'instagram' ? 'INSTAGRAM' : 'FACEBOOK'
    const connection = await db.adPlatformConnection.findUnique({
      where: { brandId_platform: { brandId, platform: platformEnum } },
    })

    if (!connection?.credentials) {
      return NextResponse.json({ error: 'No connection found. Connect the platform first.' }, { status: 404 })
    }

    const creds = connection.credentials as any
    const accessToken = creds.accessToken

    if (!accessToken) {
      return NextResponse.json({ error: 'No access token available' }, { status: 400 })
    }

    // Fetch pages from Facebook Graph API
    const pagesResponse = await fetch(
      `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${accessToken}`
    )

    if (!pagesResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch pages. You may need page-level permissions.' }, { status: 400 })
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.data || []

    if (platform === 'instagram') {
      // Filter to pages that have IG Business Accounts and enrich with IG details
      const igAccounts = []
      for (const page of pages) {
        if (page.instagram_business_account) {
          let igUsername = 'Instagram Account'
          try {
            const igResponse = await fetch(
              `${GRAPH_API_URL}/${page.instagram_business_account.id}?fields=id,username,name&access_token=${page.access_token}`
            )
            if (igResponse.ok) {
              const igData = await igResponse.json()
              igUsername = igData.username || igData.name || 'Instagram Account'
            }
          } catch {
            // Use fallback name
          }

          igAccounts.push({
            pageId: page.id,
            pageName: page.name,
            igAccountId: page.instagram_business_account.id,
            igUsername,
            category: page.category,
          })
        }
      }
      return NextResponse.json({ success: true, accounts: igAccounts })
    }

    // Facebook pages
    const formattedPages = pages.map((page: any) => ({
      id: page.id,
      name: page.name,
      category: page.category,
      hasInstagram: !!page.instagram_business_account,
    }))

    return NextResponse.json({ success: true, pages: formattedPages })
  } catch (error) {
    console.error('Meta pages fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 })
  }
}
