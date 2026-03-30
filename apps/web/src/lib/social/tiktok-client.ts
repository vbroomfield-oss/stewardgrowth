import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const TIKTOK_AUTH_URL = 'https://www.tiktok.com/v2/auth/authorize'
const TIKTOK_TOKEN_URL = 'https://open.tiktokapis.com/v2/oauth/token/'
const TIKTOK_API_URL = 'https://open.tiktokapis.com/v2'

// Scopes for TikTok video publishing
const SCOPES = ['user.info.basic', 'video.publish', 'video.upload']

export class TikTokClient implements SocialClient {
  platform = 'tiktok' as const
  private credentials: SocialCredentials | null = null

  constructor(credentials?: SocialCredentials) {
    this.credentials = credentials || null
  }

  isConnected(): boolean {
    if (!this.credentials?.accessToken) return false
    if (this.credentials.expiresAt && new Date() > this.credentials.expiresAt) return false
    return true
  }

  /**
   * Get OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.tech'}/api/oauth/tiktok/callback`

    const params = new URLSearchParams({
      client_key: clientKey!,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES.join(','),
      response_type: 'code',
    })

    return `${TIKTOK_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async handleCallback(code: string): Promise<SocialCredentials> {
    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.tech'}/api/oauth/tiktok/callback`

    const response = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`TikTok token exchange failed: ${error}`)
    }

    const data = await response.json()

    if (data.error) {
      throw new Error(`TikTok error: ${data.error.message}`)
    }

    // Get user info
    const userResponse = await fetch(`${TIKTOK_API_URL}/user/info/?fields=open_id,display_name,avatar_url`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    let accountName = 'TikTok User'
    let accountId = ''

    if (userResponse.ok) {
      const userData = await userResponse.json()
      if (userData.data?.user) {
        accountName = userData.data.user.display_name || 'TikTok User'
        accountId = userData.data.user.open_id
      }
    }

    this.credentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      accountId,
      accountName,
    }

    return this.credentials
  }

  /**
   * Post to TikTok (requires video file URL)
   * Note: TikTok only supports video posts, not text or images
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to TikTok' }
    }

    // TikTok requires a video URL
    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      return { success: false, error: 'TikTok posts require a video URL. Please create a video first.' }
    }

    try {
      const accessToken = this.credentials!.accessToken

      // Initialize video upload
      const initResponse = await fetch(`${TIKTOK_API_URL}/post/publish/video/init/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          post_info: {
            title: options.content.substring(0, 150), // TikTok caption limit
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_comment: false,
            disable_stitch: false,
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: options.mediaUrls[0],
          },
        }),
      })

      if (!initResponse.ok) {
        const error = await initResponse.json()
        return { success: false, error: `TikTok upload failed: ${JSON.stringify(error)}` }
      }

      const initData = await initResponse.json()

      if (initData.error) {
        return { success: false, error: `TikTok error: ${initData.error.message}` }
      }

      return {
        success: true,
        postId: initData.data?.publish_id,
        postUrl: 'https://www.tiktok.com', // TikTok doesn't return direct post URL
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<SocialCredentials> {
    if (!this.credentials?.refreshToken) {
      throw new Error('No refresh token available')
    }

    const clientKey = process.env.TIKTOK_CLIENT_KEY
    const clientSecret = process.env.TIKTOK_CLIENT_SECRET

    const response = await fetch(TIKTOK_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_key: clientKey!,
        client_secret: clientSecret!,
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken,
      }).toString(),
    })

    if (!response.ok) {
      throw new Error('Token refresh failed')
    }

    const data = await response.json()

    this.credentials = {
      ...this.credentials,
      accessToken: data.access_token,
      refreshToken: data.refresh_token || this.credentials.refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }

    return this.credentials
  }
}

export function createTikTokClient(credentials?: SocialCredentials): TikTokClient {
  return new TikTokClient(credentials)
}
