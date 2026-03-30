import type { SocialClient, SocialCredentials, PostOptions, PostResult, FacebookPage } from './types'
import { getInstagramScopes } from './scope-config'

const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const GRAPH_API_URL = 'https://graph.facebook.com/v18.0'

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

  getAuthUrl(state: string): string {
    const appId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.tech'}/api/oauth/instagram/callback`

    const params = new URLSearchParams({
      client_id: appId!,
      redirect_uri: redirectUri,
      state,
      scope: getInstagramScopes().join(','),
      response_type: 'code',
      auth_type: 'reauthenticate',
    })

    return `${META_AUTH_URL}?${params.toString()}`
  }

  /**
   * Fetch Instagram Business Accounts linked to user's Facebook Pages
   */
  async getInstagramAccounts(accessToken: string): Promise<Array<{ pageId: string; pageName: string; pageToken: string; igAccountId: string; igUsername: string }>> {
    const accounts: Array<{ pageId: string; pageName: string; pageToken: string; igAccountId: string; igUsername: string }> = []

    try {
      const pagesResponse = await fetch(
        `${GRAPH_API_URL}/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${accessToken}`
      )
      if (!pagesResponse.ok) return accounts

      const pagesData = await pagesResponse.json()
      const pages = pagesData.data || []

      for (const page of pages) {
        if (page.instagram_business_account) {
          // Get Instagram account details
          const igResponse = await fetch(
            `${GRAPH_API_URL}/${page.instagram_business_account.id}?fields=id,username,name&access_token=${page.access_token}`
          )
          let igUsername = 'Instagram Account'
          if (igResponse.ok) {
            const igData = await igResponse.json()
            igUsername = igData.username || igData.name || 'Instagram Account'
          }

          accounts.push({
            pageId: page.id,
            pageName: page.name,
            pageToken: page.access_token,
            igAccountId: page.instagram_business_account.id,
            igUsername,
          })
        }
      }
    } catch {
      // Pages not available
    }

    return accounts
  }

  /**
   * Exchange authorization code for access token.
   * Returns credentials with IG accounts for selection when multiple exist.
   */
  async handleCallback(code: string): Promise<SocialCredentials & { igAccounts?: Array<{ pageId: string; pageName: string; pageToken: string; igAccountId: string; igUsername: string }> }> {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.tech'}/api/oauth/instagram/callback`

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

    // Exchange for long-lived token
    let longLivedToken = tokenData.access_token
    try {
      const llParams = new URLSearchParams({
        grant_type: 'fb_exchange_token',
        client_id: appId!,
        client_secret: appSecret!,
        fb_exchange_token: tokenData.access_token,
      })
      const llResponse = await fetch(`${META_TOKEN_URL}?${llParams.toString()}`)
      if (llResponse.ok) {
        const llData = await llResponse.json()
        longLivedToken = llData.access_token || longLivedToken
      }
    } catch {
      // Use short-lived token
    }

    // Get user profile
    const profileResponse = await fetch(
      `${GRAPH_API_URL}/me?fields=id,name&access_token=${longLivedToken}`
    )
    const profile = profileResponse.ok ? await profileResponse.json() : { id: 'unknown', name: 'Instagram User' }

    // Try to find Instagram Business Accounts
    const igAccounts = await this.getInstagramAccounts(longLivedToken)

    if (igAccounts.length === 1) {
      // Auto-select single IG account
      this.credentials = {
        accessToken: longLivedToken,
        pageAccessToken: igAccounts[0].pageToken,
        pageId: igAccounts[0].pageId,
        pageName: igAccounts[0].pageName,
        accountId: igAccounts[0].igAccountId,
        accountName: igAccounts[0].igUsername,
        connectionType: 'page',
      }
      return this.credentials
    }

    if (igAccounts.length > 1) {
      // Store user token and return accounts for selection
      this.credentials = {
        accessToken: longLivedToken,
        accountId: profile.id,
        accountName: profile.name || 'Instagram Account',
        connectionType: 'personal',
      }
      return { ...this.credentials, igAccounts }
    }

    // No IG business accounts (basic scopes)
    this.credentials = {
      accessToken: longLivedToken,
      accountId: profile.id,
      accountName: profile.name || 'Instagram Account',
      connectionType: 'personal',
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

    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      return { success: false, error: 'Instagram posts require an image URL' }
    }

    try {
      // Use page token for IG API if available
      const accessToken = this.credentials!.pageAccessToken || this.credentials!.accessToken
      const igUserId = this.credentials!.accountId

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
