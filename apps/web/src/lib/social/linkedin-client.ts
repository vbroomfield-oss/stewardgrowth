import type { SocialClient, SocialCredentials, PostOptions, PostResult, LinkedInOrganization } from './types'
import { getLinkedInScopes, getLinkedInScopeMode } from './scope-config'

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization'
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken'
const LINKEDIN_API_URL = 'https://api.linkedin.com/v2'

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

  getAuthUrl(state: string): string {
    const clientId = process.env.LINKEDIN_CLIENT_ID
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.vercel.app'}/api/oauth/linkedin/callback`

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId!,
      redirect_uri: redirectUri,
      state,
      scope: getLinkedInScopes().join(' '),
    })

    return `${LINKEDIN_AUTH_URL}?${params.toString()}`
  }

  /**
   * Fetch organizations the user is admin of
   */
  async getOrganizations(accessToken: string): Promise<LinkedInOrganization[]> {
    if (getLinkedInScopeMode() !== 'organization') return []

    try {
      // Get organization ACLs (admin roles)
      const response = await fetch(
        `${LINKEDIN_API_URL}/organizationalEntityAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organizationalTarget))`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      )

      if (!response.ok) return []

      const data = await response.json()
      const elements = data.elements || []

      const orgs: LinkedInOrganization[] = []
      for (const element of elements) {
        const orgUrn = element.organizationalTarget
        if (!orgUrn) continue

        // Extract org ID from URN (urn:li:organization:12345)
        const orgId = orgUrn.split(':').pop()
        if (!orgId) continue

        // Fetch org details
        try {
          const orgResponse = await fetch(
            `${LINKEDIN_API_URL}/organizations/${orgId}?projection=(id,localizedName,vanityName)`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'X-Restli-Protocol-Version': '2.0.0',
              },
            }
          )

          if (orgResponse.ok) {
            const orgData = await orgResponse.json()
            orgs.push({
              id: orgId,
              name: orgData.localizedName || `Organization ${orgId}`,
              vanityName: orgData.vanityName,
            })
          }
        } catch {
          // Skip this org
        }
      }

      return orgs
    } catch {
      return []
    }
  }

  /**
   * Exchange authorization code for access token.
   * Returns credentials with organizations list for selection when available.
   */
  async handleCallback(code: string): Promise<SocialCredentials & { organizations?: LinkedInOrganization[] }> {
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

    // Check for organizations if in organization mode
    const organizations = await this.getOrganizations(data.access_token)

    if (organizations.length === 1) {
      // Auto-select single org
      this.credentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        accountId: organizations[0].id,
        accountName: organizations[0].name,
        organizationId: organizations[0].id,
        organizationName: organizations[0].name,
        connectionType: 'organization',
      }
      return this.credentials
    }

    if (organizations.length > 1) {
      // Return orgs for selection
      this.credentials = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
        accountId,
        accountName,
        connectionType: 'personal',
      }
      return { ...this.credentials, organizations }
    }

    // Personal profile mode
    this.credentials = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
      accountId,
      accountName,
      connectionType: 'personal',
    }

    return this.credentials
  }

  /**
   * Post content to LinkedIn — as organization if connected, otherwise personal
   */
  async post(options: PostOptions): Promise<PostResult> {
    if (!this.isConnected()) {
      return { success: false, error: 'Not connected to LinkedIn' }
    }

    try {
      // Determine author URN based on connection type
      let authorUrn: string

      if (this.credentials!.connectionType === 'organization' && this.credentials!.organizationId) {
        authorUrn = `urn:li:organization:${this.credentials!.organizationId}`
      } else {
        // Need to get person URN
        const userResponse = await fetch(`${LINKEDIN_API_URL}/userinfo`, {
          headers: {
            Authorization: `Bearer ${this.credentials!.accessToken}`,
          },
        })

        if (!userResponse.ok) {
          return { success: false, error: 'Failed to get LinkedIn user info' }
        }

        const user = await userResponse.json()
        authorUrn = `urn:li:person:${user.sub}`
      }

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

export function createLinkedInClient(credentials?: SocialCredentials): LinkedInClient {
  return new LinkedInClient(credentials)
}
