import { db } from '@/lib/db'
import type { SocialPlatform, PostOptions, PostResult, SocialCredentials } from './types'
import { createLinkedInClient } from './linkedin-client'

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
        // TODO: Implement Twitter client
        console.log(`[Publisher] Twitter posting not yet implemented`)
        return { success: false, error: 'Twitter integration coming soon' }
      }

      case 'facebook': {
        // TODO: Implement Facebook client
        console.log(`[Publisher] Facebook posting not yet implemented`)
        return { success: false, error: 'Facebook integration coming soon' }
      }

      case 'instagram': {
        // TODO: Implement Instagram client
        console.log(`[Publisher] Instagram posting not yet implemented`)
        return { success: false, error: 'Instagram integration coming soon' }
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
  const platformEnum = `${platform.toUpperCase()}_ADS` as any

  await db.adPlatformConnection.updateMany({
    where: {
      brandId,
      platform: platformEnum,
    },
    data: {
      status: 'DISCONNECTED',
      credentials: {},
    },
  })
}
