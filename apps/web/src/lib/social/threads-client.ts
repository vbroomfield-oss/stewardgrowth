import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const THREADS_API_URL = 'https://graph.threads.net/v1.0'

// Scopes for Threads publishing
const SCOPES = ['threads_basic', 'threads_content_publish']

export class ThreadsClient implements SocialClient {
  platform = 'threads' as const
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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/threads/callback`

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
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/threads/callback`

    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: appId!,
      client_secret: appSecret!,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    })

    const tokenResponse = await fetch(`${META_TOKEN_URL}?${tokenParams.toString()}`)

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Threads token exchange failed: ${error}`)
    }

    const tokenData = await tokenResponse.json()

    // Get Threads profile
    const profileResponse = await fetch(
      `${THREADS_API_URL}/me?fields=id,username,name&access_token=${tokenData.access_token}`
    )

    let accountName = 'Threads User'
    let accountId = ''

    if (profileResponse.ok) {
      const profile = await profileResponse.json()
      accountName = profile.username || profile.name || 'Threads User'
      accountId = profile.id
    }

    this.credentials = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      accountId,
      accountName,
    }

    return this.credentials
  }

  /**
   * Post to Threads
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to Threads' }
    }

    try {
      const userId = this.credentials!.accountId
      const accessToken = this.credentials!.accessToken

      // Step 1: Create media container
      const containerParams: Record<string, string> = {
        text: options.content,
        media_type: 'TEXT',
        access_token: accessToken,
      }

      // Add image if provided
      if (options.mediaUrls && options.mediaUrls.length > 0) {
        containerParams.media_type = 'IMAGE'
        containerParams.image_url = options.mediaUrls[0]
      }

      const containerResponse = await fetch(
        `${THREADS_API_URL}/${userId}/threads`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(containerParams).toString(),
        }
      )

      if (!containerResponse.ok) {
        const error = await containerResponse.json()
        return { success: false, error: `Threads container creation failed: ${JSON.stringify(error)}` }
      }

      const containerData = await containerResponse.json()
      const containerId = containerData.id

      // Step 2: Publish the thread
      const publishParams = new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken,
      })

      const publishResponse = await fetch(
        `${THREADS_API_URL}/${userId}/threads_publish`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: publishParams.toString(),
        }
      )

      if (!publishResponse.ok) {
        const error = await publishResponse.json()
        return { success: false, error: `Threads publish failed: ${JSON.stringify(error)}` }
      }

      const publishData = await publishResponse.json()

      return {
        success: true,
        postId: publishData.id,
        postUrl: `https://www.threads.net/t/${publishData.id}`,
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

export function createThreadsClient(credentials?: SocialCredentials): ThreadsClient {
  return new ThreadsClient(credentials)
}
