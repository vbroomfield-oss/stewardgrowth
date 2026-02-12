import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const YOUTUBE_API_URL = 'https://www.googleapis.com/youtube/v3'

// Scopes for YouTube video upload
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube.readonly',
]

export class YouTubeClient implements SocialClient {
  platform = 'youtube' as const
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
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/youtube/callback`

    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
    })

    return `${GOOGLE_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async handleCallback(code: string): Promise<SocialCredentials> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/youtube/callback`

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`YouTube token exchange failed: ${error}`)
    }

    const data = await response.json()

    // Get channel info
    const channelResponse = await fetch(
      `${YOUTUBE_API_URL}/channels?part=snippet&mine=true`,
      {
        headers: {
          Authorization: `Bearer ${data.access_token}`,
        },
      }
    )

    let accountName = 'YouTube Channel'
    let accountId = ''

    if (channelResponse.ok) {
      const channelData = await channelResponse.json()
      if (channelData.items && channelData.items.length > 0) {
        accountName = channelData.items[0].snippet.title
        accountId = channelData.items[0].id
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
   * Upload video to YouTube
   * Note: YouTube only supports video uploads through this API
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to YouTube' }
    }

    // YouTube requires a video file
    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      return { success: false, error: 'YouTube posts require a video URL. Please create a video first.' }
    }

    try {
      // For now, return a message that video upload needs to be done differently
      // Full YouTube upload requires multipart upload with the actual video file
      return {
        success: false,
        error: 'YouTube video upload requires a video file. Please upload the video directly through the YouTube Studio or use the video upload endpoint with the actual video file.',
      }

      // Note: Full implementation would require:
      // 1. Fetch the video from options.mediaUrls[0]
      // 2. Use resumable upload to YouTube
      // 3. This is complex and requires handling large file uploads
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

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId!,
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
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    }

    return this.credentials
  }
}

export function createYouTubeClient(credentials?: SocialCredentials): YouTubeClient {
  return new YouTubeClient(credentials)
}
