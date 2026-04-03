'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { PageSelectorModal } from '@/components/social/page-selector-modal'
import { getPlatformColor, getPlatformIcon } from '@/components/social/platform-preview'
import { cn } from '@/lib/utils'
import {
  ExternalLink, Unplug, Loader2, CheckCircle, AlertCircle,
} from 'lucide-react'

const SOCIAL_PLATFORMS = [
  { key: 'twitter', label: 'Twitter / X', oauthKey: 'twitter', description: 'Post tweets, threads, and engage' },
  { key: 'linkedin', label: 'LinkedIn', oauthKey: 'linkedin', description: 'Professional updates and articles' },
  { key: 'facebook', label: 'Facebook', oauthKey: 'facebook', description: 'Manage your page and posts' },
  { key: 'instagram', label: 'Instagram', oauthKey: 'instagram', description: 'Photos, reels, and stories' },
  { key: 'tiktok', label: 'TikTok', oauthKey: 'tiktok', description: 'Short-form video content' },
  { key: 'youtube', label: 'YouTube', oauthKey: 'youtube', description: 'Videos and channel management' },
  { key: 'pinterest', label: 'Pinterest', oauthKey: 'pinterest', description: 'Pin images and drive traffic' },
  { key: 'threads', label: 'Threads', oauthKey: 'threads', description: 'Text updates on Meta Threads' },
]

interface PlatformConnection {
  id: string
  platform: string
  status: string
  accountName: string | null
  lastSyncAt: string | null
  lastError: string | null
}

interface PortalSocialTabProps {
  brandId: string
  brandName: string
  onConnectionsChanged?: () => void
}

export function PortalSocialTab({ brandId, brandName, onConnectionsChanged }: PortalSocialTabProps) {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [connections, setConnections] = useState<PlatformConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [pageSelectorPlatform, setPageSelectorPlatform] = useState<'facebook' | 'instagram' | 'linkedin' | null>(null)
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null)

  const fetchConnections = async () => {
    try {
      const res = await fetch(`/api/platforms?brandId=${brandId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setConnections(data.connections || [])
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConnections()
  }, [brandId])

  // Handle OAuth callback query params
  useEffect(() => {
    const success = searchParams.get('success')
    const selectPage = searchParams.get('selectPage')
    const selectOrg = searchParams.get('selectOrg')
    const error = searchParams.get('error')

    if (success) {
      const platform = success.replace('_connected', '')
      toast({
        title: 'Platform Connected',
        description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} has been connected successfully.`,
      })
      fetchConnections()
      onConnectionsChanged?.()
    }

    if (error) {
      toast({
        title: 'Connection Failed',
        description: `Failed to connect: ${error.replace(/_/g, ' ')}`,
        variant: 'destructive',
      })
    }

    if (selectPage === 'facebook' || selectPage === 'instagram') {
      setPageSelectorPlatform(selectPage)
    }

    if (selectOrg === 'linkedin') {
      setPageSelectorPlatform('linkedin')
    }
  }, [searchParams])

  const getConnection = (platformKey: string): PlatformConnection | undefined => {
    const platformMap: Record<string, string> = {
      twitter: 'TWITTER',
      linkedin: 'LINKEDIN_ADS',
      facebook: 'FACEBOOK',
      instagram: 'INSTAGRAM',
      tiktok: 'TIKTOK_ADS',
      youtube: 'YOUTUBE',
      pinterest: 'PINTEREST',
      threads: 'THREADS',
    }
    return connections.find(c => c.platform === platformMap[platformKey])
  }

  const handleConnect = (oauthKey: string) => {
    window.location.href = `/api/oauth/${oauthKey}/authorize?brandId=${brandId}&source=portal`
  }

  const handleDisconnect = async (connectionId: string) => {
    setDisconnectingPlatform(connectionId)
    try {
      const res = await fetch(`/api/platforms?id=${connectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'Disconnected', description: 'Platform has been disconnected.' })
        fetchConnections()
        onConnectionsChanged?.()
      } else {
        toast({ title: 'Error', description: 'Failed to disconnect platform.', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to disconnect platform.', variant: 'destructive' })
    } finally {
      setDisconnectingPlatform(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const connectedCount = connections.filter(c => c.status === 'CONNECTED').length

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Media Accounts</CardTitle>
          <CardDescription>
            Connect your social platforms so StewardGrowth can publish content for {brandName}.
            {' '}{connectedCount} of {SOCIAL_PLATFORMS.length} connected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
              Connect each platform using {brandName}&apos;s social media login
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
              When you click Connect, you&apos;ll be redirected to log in. <strong>Use {brandName}&apos;s social media credentials</strong> — not your personal account.
              For Facebook/Instagram, log into the account that manages {brandName}&apos;s Page.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const connection = getConnection(platform.key)
              const isConnected = connection?.status === 'CONNECTED'
              const hasError = connection?.status === 'ERROR' || connection?.status === 'EXPIRED'
              const isMetaPlatform = ['facebook', 'instagram'].includes(platform.key)
              const isLinkedIn = platform.key === 'linkedin'
              const canSwitchPage = isConnected && (isMetaPlatform || isLinkedIn)

              return (
                <div
                  key={platform.key}
                  className={cn(
                    'flex items-center justify-between p-4 border rounded-lg transition-colors',
                    isConnected && 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0',
                        getPlatformColor(platform.key)
                      )}
                    >
                      {getPlatformIcon(platform.key)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{platform.label}</p>
                      {isConnected && connection?.accountName ? (
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {connection.accountName}
                        </p>
                      ) : hasError ? (
                        <p className="text-xs text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {connection?.status === 'EXPIRED' ? 'Token expired' : 'Connection error'}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{platform.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {canSwitchPage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPageSelectorPlatform(platform.key as 'facebook' | 'instagram' | 'linkedin')}
                        className="text-xs text-muted-foreground hover:text-foreground"
                        title="Switch page/account"
                      >
                        Switch
                      </Button>
                    )}
                    {isConnected ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(connection!.id)}
                        disabled={disconnectingPlatform === connection!.id}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                      >
                        {disconnectingPlatform === connection!.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Unplug className="h-4 w-4" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant={hasError ? 'default' : 'outline'}
                        onClick={() => handleConnect(platform.oauthKey)}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        {hasError ? 'Reconnect' : 'Connect'}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              Each platform requires OAuth authorization. Click Connect to grant StewardGrowth
              access to post on your behalf. You can disconnect at any time. For Facebook,
              Instagram, and LinkedIn, use the &quot;Switch&quot; button to select a specific
              Page or Company to post as.
            </p>
          </div>
        </CardContent>
      </Card>

      {pageSelectorPlatform && (
        <PageSelectorModal
          platform={pageSelectorPlatform}
          brandId={brandId}
          onSelect={(selected) => {
            toast({
              title: 'Account Updated',
              description: `Now posting as: ${selected.name}`,
            })
            setPageSelectorPlatform(null)
            fetchConnections()
            onConnectionsChanged?.()
          }}
          onClose={() => setPageSelectorPlatform(null)}
        />
      )}
    </>
  )
}
