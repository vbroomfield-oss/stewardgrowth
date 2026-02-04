// Social Media Platform Types

export type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'threads'
  | 'youtube'
  | 'pinterest'

export interface SocialCredentials {
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  accountId?: string
  accountName?: string
}

export interface PostOptions {
  content: string
  mediaUrls?: string[]
  link?: string
  hashtags?: string[]
}

export interface PostResult {
  success: boolean
  postId?: string
  postUrl?: string
  error?: string
}

export interface PlatformConnection {
  platform: SocialPlatform
  isConnected: boolean
  accountName?: string
  accountId?: string
  expiresAt?: Date
}

export interface SocialClient {
  platform: SocialPlatform
  isConnected(): boolean
  post(options: PostOptions): Promise<PostResult>
  getAuthUrl(state: string): string
  handleCallback(code: string): Promise<SocialCredentials>
  refreshToken?(): Promise<SocialCredentials>
}
