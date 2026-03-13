import type { SocialClient, SocialCredentials, PostOptions, PostResult, FacebookPage } from './types'
import { getFacebookScopes } from './scope-config'

const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0'

export class FacebookClient implements SocialClient {
  platform = 'facebook' as const
  private credentials: SocialCredentials | null = null

  constructor(credentials?: SocialCredentials) {
    this.credentials = credentials || null
  }

  isConnected(): boolean {
    if (!this.credentials?.accessToken) return false
    return true
  }

  getAuthUrl(state: string): string {
    const appId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/facebook/callback`

    const params = new URLSearchParams({
      client_id: appId!,
      redirect_uri: redirectUri,
      state,
      scope: getFacebookScopes().join(','),
      response_type: 'code',
      auth_type: 'reauthenticate',
    })

    return `${META_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange for a long-lived token (~60 days instead of ~1 hour)
   */
  async exchangeForLongLivedToken(shortToken: string): Promise<string> {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET

    const params = new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: appId!,
      client_secret: appSecret!,
      fb_exchange_token: shortToken,
    })

    const response = await fetch(`${META_TOKEN_URL}?${params.toString()}`)
    if (!response.ok) {
      console.warn('Failed to exchange for long-lived token, using short-lived')
      return shortToken
    }

    const data = await response.json()
    return data.access_token || shortToken
  }

  /**
   * Fetch all Facebook Pages the user manages
   */
  async getPages(accessToken: string): Promise<FacebookPage[]> {
    try {
      const response = await fetch(
        `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${accessToken}`
      )
      if (!response.ok) return []

      const data = await response.json()
      const pages: FacebookPage[] = (data.data || []).map((page: any) => ({
        id: page.id,
        name: page.name,
        accessToken: page.access_token,
        category: page.category,
        instagramBusinessAccount: page.instagram_business_account
          ? { id: page.instagram_business_account.id }
          : undefined,
      }))

      return pages
    } catch {
      return []
    }
  }

  /**
   * Exchange authorization code for access token.
   * Returns credentials with pages array for selection when multiple pages exist.
   */
  async handleCallback(code: string): Promise<SocialCredentials & { pages?: FacebookPage[] }> {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/facebook/callback`

    const tokenParams = new URLSearchParams({
      client_id: appId!,
      client_secret: appSecret!,
      redirect_uri: redirectUri,
      code,
    })

    const tokenResponse = await fetch(`${META_TOKEN_URL}?${tokenParams.toString()}`)

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Facebook token exchange failed: ${error}`)
    }

    const tokenData = await tokenResponse.json()

    // Exchange for long-lived user token
    const longLivedToken = await this.exchangeForLongLivedToken(tokenData.access_token)

    // Get user profile
    const profileResponse = await fetch(
      `${GRAPH_API_URL}/me?fields=id,name&access_token=${longLivedToken}`
    )
    const profile = profileResponse.ok ? await profileResponse.json() : { id: 'unknown', name: 'Facebook User' }

    // Try to get user's pages
    const pages = await this.getPages(longLivedToken)

    if (pages.length === 1) {
      // Auto-select single page
      this.credentials = {
        accessToken: longLivedToken,
        pageAccessToken: pages[0].accessToken,
        pageId: pages[0].id,
        pageName: pages[0].name,
        accountId: pages[0].id,
        accountName: pages[0].name,
        connectionType: 'page',
      }
      return this.credentials
    }

    if (pages.length > 1) {
      // Store user token and return pages for selection
      this.credentials = {
        accessToken: longLivedToken,
        accountId: profile.id,
        accountName: profile.name,
        connectionType: 'personal', // Will be upgraded after page selection
      }
      return { ...this.credentials, pages }
    }

    // No pages available (basic scopes) — store as personal profile
    this.credentials = {
      accessToken: longLivedToken,
      accountId: profile.id,
      accountName: profile.name,
      connectionType: 'personal',
    }
    return this.credentials
  }

  /**
   * Post to Facebook Page (uses page token if available)
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to Facebook' }
    }

    try {
      // Use page token for posting if available, otherwise user token
      const postToken = this.credentials!.pageAccessToken || this.credentials!.accessToken
      const pageId = this.credentials!.pageId || this.credentials!.accountId

      const postData: Record<string, string> = {
        message: options.content,
        access_token: postToken,
      }

      if (options.link) {
        postData.link = options.link
      }

      const params = new URLSearchParams(postData)

      const response = await fetch(`${GRAPH_API_URL}/${pageId}/feed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      })

      if (!response.ok) {
        const error = await response.json()
        return { success: false, error: `Facebook post failed: ${JSON.stringify(error)}` }
      }

      const result = await response.json()

      return {
        success: true,
        postId: result.id,
        postUrl: `https://www.facebook.com/${result.id}`,
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

export function createFacebookClient(credentials?: SocialCredentials): FacebookClient {
  return new FacebookClient(credentials)
}
