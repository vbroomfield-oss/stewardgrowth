import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const TWITTER_AUTH_URL = 'https://twitter.com/i/oauth2/authorize'
const TWITTER_TOKEN_URL = 'https://api.twitter.com/2/oauth2/token'
const TWITTER_API_URL = 'https://api.twitter.com/2'

// OAuth 2.0 scopes for posting
const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access']

export class TwitterClient implements SocialClient {
  platform = 'twitter' as const
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
   * Get OAuth authorization URL (OAuth 2.0 with PKCE)
   */
  getAuthUrl(state: string, codeChallenge?: string): string {
    const clientId = process.env.TWITTER_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/twitter/callback`

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES.join(' '),
      code_challenge: codeChallenge || state, // Use state as simple challenge if not provided
      code_challenge_method: 'plain',
    })

    return `${TWITTER_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async handleCallback(code: string, codeVerifier?: string): Promise<SocialCredentials> {
    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/twitter/callback`

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId!,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier || code, // Use code as verifier if not provided
    })

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Twitter token exchange failed: ${error}`)
    }

    const data = await response.json()

    // Get user profile
    const userResponse = await fetch(`${TWITTER_API_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    let accountName = 'Twitter User'
    let accountId = ''

    if (userResponse.ok) {
      const userData = await userResponse.json()
      accountName = userData.data?.username || userData.data?.name || 'Twitter User'
      accountId = userData.data?.id || ''
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
   * Post a tweet
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to Twitter' }
    }

    try {
      let tweetText = options.content

      // Add hashtags if provided
      if (options.hashtags && options.hashtags.length > 0) {
        const hashtagText = options.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
        tweetText = `${tweetText}\n\n${hashtagText}`
      }

      // Truncate if over 280 characters
      if (tweetText.length > 280) {
        tweetText = tweetText.substring(0, 277) + '...'
      }

      const response = await fetch(`${TWITTER_API_URL}/tweets`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials!.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: tweetText }),
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error: `Twitter post failed: ${error}` }
      }

      const result = await response.json()
      const tweetId = result.data?.id

      return {
        success: true,
        postId: tweetId,
        postUrl: `https://twitter.com/i/web/status/${tweetId}`,
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

    const clientId = process.env.TWITTER_CLIENT_ID
    const clientSecret = process.env.TWITTER_CLIENT_SECRET

    const params = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: this.credentials.refreshToken,
      client_id: clientId!,
    })

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(TWITTER_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: params.toString(),
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

export function createTwitterClient(credentials?: SocialCredentials): TwitterClient {
  return new TwitterClient(credentials)
}
