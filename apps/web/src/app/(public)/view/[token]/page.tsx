'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Send, Clock, FileText, Globe, BarChart3, ExternalLink,
  Twitter, Linkedin, Facebook, Instagram, Video,
  MessageCircle, Youtube, Music2, AlertCircle,
} from 'lucide-react'

interface BrandView {
  name: string
  slug: string
  logo: string | null
  color: string
  domain: string | null
  connectedPlatforms: string[]
  stats: {
    publishedPosts: number
    scheduledPosts: number
    pendingApprovals: number
    totalContent: number
  }
  recentContent: Array<{
    id: string
    title: string | null
    platforms: string[]
    status: string
    createdAt: string
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

export default function PublicViewPage() {
  const params = useParams()
  const token = params.token as string
  const [brand, setBrand] = useState<BrandView | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/portal/token/${token}/view`)
        if (res.ok) {
          const data = await res.json()
          setBrand(data.brand)
        } else {
          const data = await res.json()
          setError(data.error || 'Invalid or expired link')
        }
      } catch {
        setError('Failed to load brand data')
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="py-8 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-lg font-medium">{error || 'Brand not found'}</p>
            <p className="text-sm text-muted-foreground mt-2">
              This link may have expired or been revoked.
            </p>
            <Button asChild className="mt-4">
              <Link href="/login">Sign in for full access</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Shared Link Banner */}
      <div className="bg-primary/10 border-b px-4 py-2 text-center">
        <p className="text-sm">
          You&apos;re viewing a shared link.{' '}
          <Link href="/signup" className="font-medium underline underline-offset-2">
            Sign up for full portal access
          </Link>
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Brand Header */}
        <div className="flex items-center gap-4 mb-8">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl"
            style={{ backgroundColor: brand.color }}
          >
            {brand.logo ? (
              <img src={brand.logo} alt={brand.name} className="h-14 w-14 rounded-xl object-cover" />
            ) : (
              brand.name[0]
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{brand.name}</h1>
            {brand.domain && (
              <div className="flex items-center gap-1 text-muted-foreground mt-1">
                <Globe className="h-3.5 w-3.5" />
                <span className="text-sm">{brand.domain}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Published', value: brand.stats.publishedPosts, icon: Send, color: 'text-green-600' },
            { label: 'Scheduled', value: brand.stats.scheduledPosts, icon: Clock, color: 'text-blue-600' },
            { label: 'Pending', value: brand.stats.pendingApprovals, icon: FileText, color: 'text-amber-600' },
            { label: 'Platforms', value: brand.connectedPlatforms.length, icon: Globe, color: 'text-purple-600' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Connected Platforms */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Connected Platforms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brand.connectedPlatforms.map(p => {
                const Icon = platformIcons[p]
                return (
                  <Badge key={p} variant="secondary" className="gap-1.5 py-1 px-3">
                    {Icon && <Icon className="h-3.5 w-3.5" />}
                    <span className="capitalize">{p}</span>
                  </Badge>
                )
              })}
              {brand.connectedPlatforms.length === 0 && (
                <p className="text-sm text-muted-foreground">No platforms connected yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Content</CardTitle>
          </CardHeader>
          <CardContent>
            {brand.recentContent.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No content yet.</p>
            ) : (
              <div className="space-y-2">
                {brand.recentContent.map(post => (
                  <div key={post.id} className="flex items-center gap-3 p-2 rounded border">
                    <div className="flex gap-1">
                      {post.platforms.map(p => {
                        const Icon = platformIcons[p]
                        return Icon ? <Icon key={p} className="h-3.5 w-3.5 text-muted-foreground" /> : null
                      })}
                    </div>
                    <span className="text-sm flex-1 truncate">{post.title || 'Untitled'}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {post.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
