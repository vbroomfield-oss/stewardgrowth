import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0'

// Scopes for Facebook - basic scopes work in dev mode, page scopes need App Review
const SCOPES = ['public_profile', 'email']

export class FacebookClient implements SocialClient {
  platform = 'facebook' as const
  private credentials: SocialCredentials | null = null

  constructor(credentials?: SocialCredentials) {
    this.credentials = credentials || null
  }

  isConnected(): boolean {
    if (!this.credentials?.accessToken) return false
    // Facebook tokens can be long-lived, so we don't always check expiry
    return true
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const appId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/facebook/callback`

    const params = new URLSearchParams({
      client_id: appId!,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES.join(','),
      response_type: 'code',
    })

    return `${META_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async handleCallback(code: string): Promise<SocialCredentials> {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/facebook/callback`

    // Exchange code for user access token
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

    // Get user profile
    const profileResponse = await fetch(
      `${GRAPH_API_URL}/me?fields=id,name&access_token=${tokenData.access_token}`
    )
    const profile = profileResponse.ok ? await profileResponse.json() : { id: 'unknown', name: 'Facebook User' }

    // Try to get user's pages (requires pages_show_list scope - may not be available in dev mode)
    let accountToken = tokenData.access_token
    let accountId = profile.id
    let accountName = profile.name

    try {
      const pagesResponse = await fetch(
        `${GRAPH_API_URL}/me/accounts?access_token=${tokenData.access_token}`
      )
      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        const pages = pagesData.data || []
        if (pages.length > 0) {
          // Use page token for posting if available
          accountToken = pages[0].access_token
          accountId = pages[0].id
          accountName = pages[0].name
        }
      }
    } catch {
      // Pages not available - use user token (dev mode)
    }

    this.credentials = {
      accessToken: accountToken,
      accountId,
      accountName,
    }

    return this.credentials
  }

  /**
   * Post to Facebook Page
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to Facebook' }
    }

    try {
      const pageId = this.credentials!.accountId

      const postData: Record<string, string> = {
        message: options.content,
        access_token: this.credentials!.accessToken,
      }

      // Add link if provided
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
