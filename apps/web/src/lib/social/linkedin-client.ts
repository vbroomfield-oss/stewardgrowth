import type { SocialClient, SocialCredentials, PostOptions, PostResult } from './types'

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2'

// Required scopes for posting
const SCOPES = ['openid', 'profile', 'email', 'w_member_social']

export class LinkedInClient implements SocialClient {
  platform = 'linkedin' as const
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
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/linkedin/callback`

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      redirect_uri: redirectUri,
      state,
      scope: SCOPES.join(' '),
    })

    return `${LINKEDIN_AUTH_URL}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async handleCallback(code: string): Promise<SocialCredentials> {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/linkedin/callback`

    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri,
    })

    const response = await fetch(LINKEDIN_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LinkedIn token exchange failed: ${error}`)
    }

    const data = await response.json()

    // Get user profile
    const profileResponse = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
      headers: {
        Authorization: `Bearer ${data.access_token}`,
      },
    })

    let accountName = 'LinkedIn User'
    let accountId = ''

    if (profileResponse.ok) {
      const profile = await profileResponse.json()
      accountName = profile.name || `${profile.given_name} ${profile.family_name}`
      accountId = profile.sub
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
   * Post content to LinkedIn
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to LinkedIn' }
    }

    try {
      // Get user URN
      const userResponse = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${this.credentials!.accessToken}`,
        },
      })

      if (!userResponse.ok) {
        return { success: false, error: 'Failed to get LinkedIn user info' }
      }

      const user = await userResponse.json()
      const authorUrn = `urn:li:person:${user.sub}`

      // Build share content
      const shareContent: any = {
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: options.content,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }

      // Add link if provided
      if (options.link) {
        shareContent.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'ARTICLE'
        shareContent.specificContent['com.linkedin.ugc.ShareContent'].media = [
          {
            status: 'READY',
            originalUrl: options.link,
          },
        ]
      }

      const response = await fetch(`${LINKEDIN_API_URL}/ugcPosts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.credentials!.accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        body: JSON.stringify(shareContent),
      })

      if (!response.ok) {
        const error = await response.text()
        return { success: false, error: `LinkedIn post failed: ${error}` }
      }

      const result = await response.json()
      const postId = result.id

      return {
        success: true,
        postId,
        postUrl: `https://www.linkedin.com/feed/update/${postId}`,
      }
    } catch (error) {
      return { success: false, error: String(error) }
    }
  }
}

/**
 * Create LinkedIn client from stored credentials
 */
export function createLinkedInClient(credentials?: SocialCredentials): LinkedInClient {
  return new LinkedInClient(credentials)
}
