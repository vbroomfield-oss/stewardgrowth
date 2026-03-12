'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ArrowLeft,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Unplug,
  AlertCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPlatformColor, getPlatformIcon } from '@/components/social/platform-preview'
import { toast } from '@/components/ui/use-toast'

interface Brand {
  id: string
  name: string
  slug: string
}

interface PlatformConnection {
  id: string
  platform: string
  status: string
  accountName: string | null
  accountId: string | null
  lastSyncAt: string | null
  lastError: string | null
  createdAt: string
}

const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'Twitter / X', oauthKey: 'twitter', description: 'Post tweets, threads, and engage with your audience' },
  { key: 'linkedin', label: 'LinkedIn', oauthKey: 'linkedin', description: 'Share professional updates and articles' },
  { key: 'facebook', label: 'Facebook', oauthKey: 'facebook', description: 'Manage your Facebook page and posts' },
  { key: 'instagram', label: 'Instagram', oauthKey: 'instagram', description: 'Share photos, reels, and stories' },
  { key: 'tiktok', label: 'TikTok', oauthKey: 'tiktok', description: 'Create and share short-form video content' },
  { key: 'youtube', label: 'YouTube', oauthKey: 'youtube', description: 'Upload videos and manage your channel' },
  { key: 'pinterest', label: 'Pinterest', oauthKey: 'pinterest', description: 'Pin images and drive traffic' },
  { key: 'threads', label: 'Threads', oauthKey: 'threads', description: 'Share text updates on Meta Threads' },
]

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  CONNECTED: { label: 'Connected', color: 'text-green-600', icon: CheckCircle },
  PENDING: { label: 'Pending', color: 'text-yellow-600', icon: Clock },
  ERROR: { label: 'Error', color: 'text-red-600', icon: AlertCircle },
  EXPIRED: { label: 'Expired', color: 'text-orange-600', icon: AlertCircle },
  DISCONNECTED: { label: 'Disconnected', color: 'text-gray-500', icon: XCircle },
}

export default function SocialConnectionsPage() {
  const params = useParams()
  const slug = params.slug as string

  const [brand, setBrand] = useState<Brand | null>(null)
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [slug])

  async function fetchData() {
    try {
      setLoading(true)

      // Fetch brand
      const brandRes = await fetch(`/api/brands/${slug}`, { credentials: 'include' })
      if (!brandRes.ok) return

      const brandData = await brandRes.json()
      const b = brandData.brand
      if (!b) return
      setBrand(b)

      // Fetch connections for this brand
      const connRes = await fetch(`/api/platforms?brandId=${b.id}`, { credentials: 'include' })
      if (connRes.ok) {
        const connData = await connRes.json()
        setConnections(connData.data || [])
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  function getConnection(platformKey: string): PlatformConnection | undefined {
    return connections.find(
      (c) => c.platform === platformKey && c.status !== 'DISCONNECTED'
    )
  }

  async function handleDisconnect(connectionId: string) {
    if (!confirm('Disconnect this platform? You can reconnect anytime.')) return

    setDisconnecting(connectionId)
    try {
      const res = await fetch(`/api/platforms?id=${connectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (res.ok) {
        toast({ title: 'Disconnected', description: 'Platform has been disconnected.' })
        await fetchData()
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to disconnect', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to disconnect platform', variant: 'destructive' })
    } finally {
      setDisconnecting(null)
    }
  }

  function handleConnect(oauthKey: string) {
    if (!brand) return
    window.location.href = `/api/oauth/${oauthKey}/authorize?brandId=${brand.id}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>Brand not found</p>
      </div>
    )
  }

  const connectedCount = connections.filter((c) => c.status === 'CONNECTED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/brands/${slug}`}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Social Accounts</h1>
          <p className="text-muted-foreground">
            Connect social media platforms for {brand.name}
          </p>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">
                  {connectedCount} of {SOCIAL_PLATFORMS.length} platforms connected
                </p>
                <p className="text-sm text-muted-foreground">
                  Connect your social accounts to publish content directly
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Platform Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {SOCIAL_PLATFORMS.map((platform) => {
          const connection = getConnection(platform.key)
          const isConnected = connection?.status === 'CONNECTED'
          const statusInfo = connection ? STATUS_CONFIG[connection.status] || STATUS_CONFIG.DISCONNECTED : null
          const StatusIcon = statusInfo?.icon

          return (
            <Card
              key={platform.key}
              className={cn(
                'transition-colors',
                isConnected && 'border-green-200 dark:border-green-900'
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Platform icon */}
                    <div
                      className={cn(
                        'w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0',
                        getPlatformColor(platform.key)
                      )}
                    >
                      {getPlatformIcon(platform.key)}
                    </div>

                    <div>
                      <h3 className="font-semibold">{platform.label}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {platform.description}
                      </p>

                      {/* Connection status */}
                      {connection && statusInfo && StatusIcon && (
                        <div className="mt-2 space-y-1">
                          <div className={cn('flex items-center gap-1.5 text-sm font-medium', statusInfo.color)}>
                            <StatusIcon className="h-4 w-4" />
                            {statusInfo.label}
                          </div>
                          {connection.accountName && (
                            <p className="text-xs text-muted-foreground">
                              Account: {connection.accountName}
                            </p>
                          )}
                          {connection.lastSyncAt && (
                            <p className="text-xs text-muted-foreground">
                              Last synced: {new Date(connection.lastSyncAt).toLocaleDateString()}
                            </p>
                          )}
                          {connection.lastError && connection.status === 'ERROR' && (
                            <p className="text-xs text-red-600">
                              {connection.lastError}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="shrink-0 ml-4">
                    {isConnected ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDisconnect(connection!.id)}
                        disabled={disconnecting === connection!.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        {disconnecting === connection!.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Unplug className="h-4 w-4 mr-1.5" />
                            Disconnect
                          </>
                        )}
                      </Button>
                    ) : connection?.status === 'ERROR' || connection?.status === 'EXPIRED' ? (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.oauthKey)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Reconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(platform.oauthKey)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1.5" />
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Help Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-base">Need help connecting?</CardTitle>
          <CardDescription>
            Each platform requires a developer app with OAuth credentials configured.
            The connect button will redirect you to the platform&apos;s authorization page
            where you&apos;ll grant access to your account.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}
