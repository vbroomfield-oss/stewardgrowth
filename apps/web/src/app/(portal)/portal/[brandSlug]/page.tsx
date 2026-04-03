'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { PortalStatsCard } from '@/components/portal/portal-stats-card'
import { ActivityTimeline } from '@/components/portal/activity-timeline'
import { PortalSocialTab } from '@/components/portal/portal-social-tab'
import {
  Send, Clock, FileText, Globe, BarChart3,
  Twitter, Linkedin, Facebook, Instagram, Video,
  MessageCircle, Youtube, Music2, Loader2,
} from 'lucide-react'

interface BrandDetail {
  id: string
  name: string
  slug: string
  logo: string | null
  domain: string | null
  color: string
  connectedPlatforms: Array<{ platform: string; accountName: string | null }>
  stats: {
    publishedPosts: number
    scheduledPosts: number
    pendingApprovals: number
    totalContent: number
    totalEvents: number
  }
  recentContent: Array<{
    id: string
    title: string | null
    content: string | null
    platforms: string[]
    status: string
    scheduledFor: string | null
    publishedAt: string | null
    createdAt: string
    aiGenerated: boolean
  }>
  activities: Array<{
    id: string
    title: string
    type: 'published' | 'approved' | 'rejected' | 'scheduled' | 'created'
    platform?: string
    date: string
  }>
}

const platformIcons: Record<string, any> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  tiktok: Video,
  threads: MessageCircle,
  youtube: Youtube,
  pinterest: Music2,
}

const statusColors: Record<string, string> = {
  PUBLISHED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  APPROVED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  AWAITING_APPROVAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  SCHEDULED: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  DRAFT: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
}

function PortalBrandContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const brandSlug = params.brandSlug as string
  const initialTab = searchParams.get('tab') || 'overview'
  const [brand, setBrand] = useState<BrandDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const res = await fetch(`/api/portal/brands/${brandSlug}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setBrand(data.brand)
      }
    } catch (error) {
      console.error('Failed to load brand:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (brandSlug) load()
  }, [brandSlug])

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-muted-foreground">Brand not found</p>
      </div>
    )
  }

  return (
    <div>
      {/* Brand Header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-xl"
          style={{ backgroundColor: brand.color }}
        >
          {brand.logo ? (
            <img src={brand.logo} alt={brand.name} className="h-12 w-12 rounded-xl object-cover" />
          ) : (
            brand.name[0]
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {brand.domain && (
              <span className="text-sm text-muted-foreground">{brand.domain}</span>
            )}
            <div className="flex gap-1">
              {brand.connectedPlatforms.map(cp => {
                const Icon = platformIcons[cp.platform]
                return Icon ? (
                  <Icon key={cp.platform} className="h-4 w-4 text-muted-foreground" title={cp.platform} />
                ) : null
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <PortalStatsCard title="Published" value={brand.stats.publishedPosts} icon={Send} color="text-green-600" />
        <PortalStatsCard title="Scheduled" value={brand.stats.scheduledPosts} icon={Clock} color="text-blue-600" />
        <PortalStatsCard title="Pending Review" value={brand.stats.pendingApprovals} icon={FileText} color="text-amber-600" />
        <PortalStatsCard title="Connected Platforms" value={brand.connectedPlatforms.length} icon={Globe} color="text-purple-600" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue={initialTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="social">Social Connections</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Connected Platforms */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Connected Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                {brand.connectedPlatforms.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No platforms connected yet.</p>
                ) : (
                  <div className="space-y-2">
                    {brand.connectedPlatforms.map(cp => {
                      const Icon = platformIcons[cp.platform]
                      return (
                        <div key={cp.platform} className="flex items-center gap-2">
                          {Icon && <Icon className="h-4 w-4" />}
                          <span className="text-sm capitalize">{cp.platform}</span>
                          {cp.accountName && (
                            <span className="text-xs text-muted-foreground">({cp.accountName})</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTimeline activities={brand.activities} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Content ({brand.stats.totalContent} total)</CardTitle>
            </CardHeader>
            <CardContent>
              {brand.recentContent.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No content yet.</p>
              ) : (
                <div className="space-y-3">
                  {brand.recentContent.map(post => (
                    <div key={post.id} className="flex items-start gap-3 p-3 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{post.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {post.content?.substring(0, 120)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex gap-1">
                            {post.platforms.map(p => {
                              const Icon = platformIcons[p]
                              return Icon ? <Icon key={p} className="h-3 w-3 text-muted-foreground" /> : null
                            })}
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${statusColors[post.status] || ''}`}>
                            {post.status.replace(/_/g, ' ')}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(post.publishedAt || post.createdAt).toLocaleDateString()}
                          </span>
                          {post.aiGenerated && (
                            <Badge variant="secondary" className="text-[10px]">AI</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Connections Tab */}
        <TabsContent value="social">
          <PortalSocialTab
            brandId={brand.id}
            brandName={brand.name}
            onConnectionsChanged={() => load()}
          />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <AnalyticsSection brandSlug={brandSlug} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function PortalBrandPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    }>
      <PortalBrandContent />
    </Suspense>
  )
}

function AnalyticsSection({ brandSlug }: { brandSlug: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/portal/brands/${brandSlug}/analytics?range=30d`, {
          credentials: 'include',
        })
        if (res.ok) {
          const json = await res.json()
          setData(json.data)
        }
      } catch (error) {
        console.error('Failed to load analytics:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [brandSlug])

  if (loading) {
    return <Skeleton className="h-48" />
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>Analytics data not available yet.</p>
          <p className="text-xs mt-1">Data will appear once marketing events are tracked.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Last 30 Days</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold">{data.totalEvents}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
            {data.contentStats.map((cs: any) => (
              <div key={cs.status}>
                <p className="text-2xl font-bold">{cs.count}</p>
                <p className="text-sm text-muted-foreground capitalize">{cs.status.toLowerCase().replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {data.topSources.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Top Traffic Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.topSources.map((source: any) => (
                <div key={source.source} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{source.source}</span>
                  <span className="text-sm font-medium">{source.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.eventsByType.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Events by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.eventsByType.map((et: any) => (
                <div key={et.type} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{et.type.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-medium">{et.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
