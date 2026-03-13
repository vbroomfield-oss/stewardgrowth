import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0'

// Scopes for Instagram - basic scopes work in dev mode, publishing scopes need App Review
const SCOPES = [
  'public_profile',
  'email',
]

export class InstagramClient implements SocialClient {
  platform = 'instagram' as const
  private credentials: SocialCredentials | null = null

  constructor(credentials?: SocialCredentials) {
    this.credentials = credentials || null
  }

  isConnected(): boolean {
    if (!this.credentials?.accessToken) return false
    return true
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const appId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/instagram/callback`

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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/instagram/callback`

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
      throw new Error(`Instagram token exchange failed: ${error}`)
    }

    const tokenData = await tokenResponse.json()

    // Get user profile first
    const profileResponse = await fetch(
      `${GRAPH_API_URL}/me?fields=id,name&access_token=${tokenData.access_token}`
    )
    const profile = profileResponse.ok ? await profileResponse.json() : { id: 'unknown', name: 'Instagram User' }

    // Try to get user's pages and their Instagram accounts (requires page scopes)
    let accountToken = tokenData.access_token
    let accountId = profile.id
    let accountName = profile.name || 'Instagram Account'

    try {
      const pagesResponse = await fetch(
        `${GRAPH_API_URL}/me/accounts?fields=instagram_business_account,name,access_token&access_token=${tokenData.access_token}`
      )

      if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json()
        const pages = pagesData.data || []

        for (const page of pages) {
          if (page.instagram_business_account) {
            accountToken = page.access_token
            accountId = page.instagram_business_account.id

            // Get Instagram account details
            const igResponse = await fetch(
              `${GRAPH_API_URL}/${page.instagram_business_account.id}?fields=username,name&access_token=${page.access_token}`
            )
            if (igResponse.ok) {
              const igData = await igResponse.json()
              accountName = igData.username || igData.name || 'Instagram Account'
            }
            break
          }
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
   * Post to Instagram (requires image URL)
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to Instagram' }
    }

    // Instagram requires an image URL for posts
    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      return { success: false, error: 'Instagram posts require an image URL' }
    }

    try {
      const igUserId = this.credentials!.accountId
      const accessToken = this.credentials!.accessToken

      // Step 1: Create media container
      const containerParams = new URLSearchParams({
        image_url: options.mediaUrls[0],
        caption: options.content,
        access_token: accessToken,
      })

      const containerResponse = await fetch(
        `${GRAPH_API_URL}/${igUserId}/media?${containerParams.toString()}`,
        { method: 'POST' }
      )

      if (!containerResponse.ok) {
        const error = await containerResponse.json()
        return { success: false, error: `Instagram container creation failed: ${JSON.stringify(error)}` }
      }

      const containerData = await containerResponse.json()
      const containerId = containerData.id

      // Step 2: Publish the container
      const publishParams = new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken,
      })

      const publishResponse = await fetch(
        `${GRAPH_API_URL}/${igUserId}/media_publish?${publishParams.toString()}`,
        { method: 'POST' }
      )

      if (!publishResponse.ok) {
        const error = await publishResponse.json()
        return { success: false, error: `Instagram publish failed: ${JSON.stringify(error)}` }
      }

      const publishData = await publishResponse.json()

      return {
        success: true,
        postId: publishData.id,
        postUrl: `https://www.instagram.com/p/${publishData.id}`,
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

export function createInstagramClient(credentials?: SocialCredentials): InstagramClient {
  return new InstagramClient(credentials)
}
