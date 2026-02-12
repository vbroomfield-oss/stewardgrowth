import { db } from '@/lib/db'
import type { SocialPlatform, PostOptions, PostResult, SocialCredentials } from './types'
import { createLinkedInClient } from './linkedin-client'
import { createTwitterClient } from './twitter-client'
import { createFacebookClient } from './facebook-client'
import { createInstagramClient } from './instagram-client'
import { createThreadsClient } from './threads-client'
import { createTikTokClient } from './tiktok-client'
import { createYouTubeClient } from './youtube-client'
import { createPinterestClient } from './pinterest-client'

/**
 * Unified Social Media Publisher
 * Handles publishing to all connected platforms
 */
export class SocialPublisher {
  private brandId: string

  constructor(brandId: string) {
    this.brandId = brandId
  }

  /**
   * Get all platform connections for the brand
   */
  async getConnections() {
    const connections = await db.adPlatformConnection.findMany({
      where: { brandId: this.brandId },
    })

    return connections.map((conn) => ({
      platform: conn.platform.toLowerCase().replace('_ads', '') as SocialPlatform,
      isConnected: conn.status === 'CONNECTED',
      accountName: conn.accountName,
      accountId: conn.accountId,
      credentials: conn.credentials as SocialCredentials | null,
    }))
  }

  /**
   * Check if a specific platform is connected
   */
  async isConnected(platform: SocialPlatform): Promise<boolean> {
    const connections = await this.getConnections()
    const conn = connections.find((c) => c.platform === platform)
    return conn?.isConnected ?? false
  }

  /**
   * Post to a specific platform
   */
  async postTo(platform: SocialPlatform, options: PostOptions): Promise<PostResult> {
    const connections = await this.getConnections()
    const conn = connections.find((c) => c.platform === platform)

    if (!conn?.isConnected || !conn.credentials) {
      return { success: false, error: `${platform} is not connected` }
    }

    switch (platform) {
      case 'linkedin': {
        const client = createLinkedInClient(conn.credentials)
        return client.post(options)
      }

      case 'twitter': {
        const client = createTwitterClient(conn.credentials)
        return client.post(options)
      }

      case 'facebook': {
        const client = createFacebookClient(conn.credentials)
        return client.post(options)
      }

      case 'instagram': {
        const client = createInstagramClient(conn.credentials)
        return client.post(options)
      }

      case 'threads': {
        const client = createThreadsClient(conn.credentials)
        return client.post(options)
      }

      case 'tiktok': {
        const client = createTikTokClient(conn.credentials)
        return client.post(options)
      }

      case 'youtube': {
        const client = createYouTubeClient(conn.credentials)
        return client.post(options)
      }

      case 'pinterest': {
        const client = createPinterestClient(conn.credentials)
        return client.post(options)
      }

      default:
        return { success: false, error: `Unknown platform: ${platform}` }
    }
  }

  /**
   * Post to all connected platforms
   */
  async postToAll(options: PostOptions): Promise<Record<SocialPlatform, PostResult>> {
    const connections = await this.getConnections()
    const connectedPlatforms = connections.filter((c) => c.isConnected)

    const results: Record<string, PostResult> = {}

    for (const conn of connectedPlatforms) {
      results[conn.platform] = await this.postTo(conn.platform, options)
    }

    return results as Record<SocialPlatform, PostResult>
  }

  /**
   * Post to specific platforms
   */
  async postToMultiple(
    platforms: SocialPlatform[],
    options: PostOptions
  ): Promise<Record<SocialPlatform, PostResult>> {
    const results: Record<string, PostResult> = {}

    for (const platform of platforms) {
      results[platform] = await this.postTo(platform, options)
    }

    return results as Record<SocialPlatform, PostResult>
  }
}

/**
 * Create a social publisher for a brand
 */
export function createPublisher(brandId: string): SocialPublisher {
  return new SocialPublisher(brandId)
}

/**
 * Disconnect a platform
 */
export async function disconnectPlatform(brandId: string, platform: SocialPlatform) {
  // Map platform names to enum values
  const platformMap: Record<string, string> = {
    linkedin: 'LINKEDIN_ADS',
    twitter: 'TWITTER',
    facebook: 'FACEBOOK',
    instagram: 'INSTAGRAM',
    threads: 'THREADS',
    tiktok: 'TIKTOK_ADS',
    youtube: 'YOUTUBE',
    pinterest: 'PINTEREST',
  }

  const platformEnum = platformMap[platform] || `${platform.toUpperCase()}`

  await db.adPlatformConnection.updateMany({
    where: {
      brandId,
      platform: platformEnum as any,
    },
    data: {
      status: 'DISCONNECTED',
      credentials: {},
    },
  })
}
