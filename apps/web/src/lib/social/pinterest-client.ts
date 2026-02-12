import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const PINTEREST_AUTH_URL = 'https://www.pinterest.com/oauth'
const PINTEREST_TOKEN_URL = 'https://api.pinterest.com/v5/oauth/token'
const PINTEREST_API_URL = 'https://api.pinterest.com/v5'

// Scopes for Pinterest pin creation
const SCOPES = ['boards:read', 'pins:read', 'pins:write']

export class PinterestClient implements SocialClient {
  platform = 'pinterest' as const
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
    const appId = process.env.PINTEREST_APP_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/pinterest/callback`

    const params = new URLSearchParams({
      client_id: appId!,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES.join(','),
      response_type: 'code',
    })

    return `${PINTEREST_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async handleCallback(code: string): Promise<SocialCredentials> {
    const appId = process.env.PINTEREST_APP_ID
    const appSecret = process.env.PINTEREST_APP_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/pinterest/callback`

    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64')

    const response = await fetch(PINTEREST_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Pinterest token exchange failed: ${error}`)
    }

    const data = await response.json()

    // Get user info
    const userResponse = await fetch(`${PINTEREST_API_URL}/user_account`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    let accountName = 'Pinterest User'
    let accountId = ''

    if (userResponse.ok) {
      const userData = await userResponse.json()
      accountName = userData.username || 'Pinterest User'
      accountId = userData.id || ''
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
   * Create a Pinterest Pin
   * Pinterest requires an image for all pins
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to Pinterest' }
    }

    // Pinterest requires an image URL
    if (!options.mediaUrls || options.mediaUrls.length === 0) {
      return { success: false, error: 'Pinterest pins require an image URL' }
    }

    try {
      const accessToken = this.credentials!.accessToken

      // First, get user's boards
      const boardsResponse = await fetch(`${PINTEREST_API_URL}/boards`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!boardsResponse.ok) {
        return { success: false, error: 'Failed to fetch Pinterest boards' }
      }

      const boardsData = await boardsResponse.json()
      const boards = boardsData.items || []

      if (boards.length === 0) {
        return { success: false, error: 'No Pinterest boards found. Please create a board first.' }
      }

      // Use the first board (or could let user select)
      const boardId = boards[0].id

      // Create the pin
      const pinData = {
        board_id: boardId,
        media_source: {
          source_type: 'image_url',
          url: options.mediaUrls[0],
        },
        description: options.content,
        link: options.link,
      }

      const pinResponse = await fetch(`${PINTEREST_API_URL}/pins`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pinData),
      })

      if (!pinResponse.ok) {
        const error = await pinResponse.json()
        return { success: false, error: `Pinterest pin creation failed: ${JSON.stringify(error)}` }
      }

      const pinResult = await pinResponse.json()

      return {
        success: true,
        postId: pinResult.id,
        postUrl: `https://www.pinterest.com/pin/${pinResult.id}`,
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

    const appId = process.env.PINTEREST_APP_ID
    const appSecret = process.env.PINTEREST_APP_SECRET
    const basicAuth = Buffer.from(`${appId}:${appSecret}`).toString('base64')

    const response = await fetch(PINTEREST_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: new URLSearchParams({
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

export function createPinterestClient(credentials?: SocialCredentials): PinterestClient {
  return new PinterestClient(credentials)
}
