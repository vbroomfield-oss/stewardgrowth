import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'
import { getThreadsScopes, useThreadsOAuth } from './scope-config'

const META_AUTH_URL = 'https://www.facebook.com/v18.0/dialog/oauth'
const THREADS_AUTH_URL = 'https://www.threads.net/oauth/authorize'
const META_TOKEN_URL = 'https://graph.facebook.com/v18.0/oauth/access_token'
const THREADS_TOKEN_URL = 'https://graph.threads.net/oauth/access_token'
const THREADS_API_URL = 'https://graph.threads.net/v1.0'

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

  getAuthUrl(state: string): string {
    const appId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/threads/callback`
    const scopes = getThreadsScopes()

    if (useThreadsOAuth()) {
      // Use Threads-specific OAuth endpoint (for approved apps)
      const params = new URLSearchParams({
        client_id: appId!,
        redirect_uri: redirectUri,
        state,
        scope: scopes.join(','),
        response_type: 'code',
      })
      return `${THREADS_AUTH_URL}?${params.toString()}`
    }

    // Use Facebook OAuth endpoint (basic/dev mode)
    const params = new URLSearchParams({
      client_id: appId!,
      redirect_uri: redirectUri,
      state,
      scope: scopes.join(','),
      response_type: 'code',
    })
    return `${META_AUTH_URL}?${params.toString()}`
  }

  async handleCallback(code: string): Promise<SocialCredentials> {
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/threads/callback`

    // Use the appropriate token endpoint based on scope mode
    const tokenUrl = useThreadsOAuth() ? THREADS_TOKEN_URL : META_TOKEN_URL

    const tokenParams = new URLSearchParams({
      client_id: appId!,
      client_secret: appSecret!,
      redirect_uri: redirectUri,
      code,
      grant_type: 'authorization_code',
    })

    const tokenResponse = await fetch(`${tokenUrl}?${tokenParams.toString()}`)

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      throw new Error(`Threads token exchange failed: ${error}`)
    }

    const tokenData = await tokenResponse.json()

    // Try to get long-lived token for Threads
    let accessToken = tokenData.access_token
    if (useThreadsOAuth()) {
      try {
        const llParams = new URLSearchParams({
          grant_type: 'th_exchange_token',
          client_secret: appSecret!,
          access_token: tokenData.access_token,
        })
        const llResponse = await fetch(`https://graph.threads.net/access_token?${llParams.toString()}`)
        if (llResponse.ok) {
          const llData = await llResponse.json()
          accessToken = llData.access_token || accessToken
        }
      } catch {
        // Use short-lived token
      }
    }

    // Try Threads profile first, fall back to Facebook profile
    let accountName = 'Threads User'
    let accountId = ''

    try {
      const profileResponse = await fetch(
        `${THREADS_API_URL}/me?fields=id,username,name&access_token=${accessToken}`
      )
      if (profileResponse.ok) {
        const profile = await profileResponse.json()
        accountName = profile.username || profile.name || 'Threads User'
        accountId = profile.id
      }
    } catch {
      // Threads API not available
    }

    if (!accountId) {
      try {
        const fbProfile = await fetch(
          `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`
        )
        if (fbProfile.ok) {
          const profile = await fbProfile.json()
          accountName = profile.name || 'Threads User'
          accountId = profile.id
        }
      } catch {
        accountId = 'unknown'
      }
    }

    this.credentials = {
      accessToken,
      refreshToken: tokenData.refresh_token,
      expiresAt: tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : undefined,
      accountId,
      accountName,
      connectionType: 'personal',
    }

    return this.credentials
  }

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
