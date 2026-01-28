'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  ExternalLink,
  ArrowLeft,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  FileText,
  Megaphone,
  Search,
  BarChart3,
  Wallet,
  Code,
  Loader2,
  AlertCircle,
  Copy,
  CheckCircle,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  domain: string | null
  color: string
  brandVoice: any
  targetAudiences: any[]
  goals: any
  budgetConstraints: any
  settings: any
  eventsCount: number
  contentCount: number
  campaignsCount: number
}

export default function BrandDetailPage() {
  const params = useParams()
  const slug = params.slug as string

  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetchBrand()
  }, [slug])

  const fetchBrand = async () => {
    try {
      const response = await fetch(`/api/brands/${slug}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch brand')
      }

      setBrand(result.brand)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/brands">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Brand Not Found</h1>
        </div>
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700 dark:text-red-300">{error || 'Brand not found'}</p>
          <Button variant="outline" size="sm" asChild>
            <Link href="/brands">Back to Brands</Link>
          </Button>
        </div>
      </div>
    )
  }

  const brandVoice = brand.brandVoice || {}
  const goals = brand.goals?.monthly || { leads: 100, trials: 25, revenue: 50000 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/brands">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: brand.color }}
            >
              {brand.name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
              {brand.domain && (
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  {brand.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/brands/${brand.slug}/connect`}>
              <Code className="mr-2 h-4 w-4" />
              Tracking Code
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/brands/${brand.slug}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                <Target className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brand.eventsCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Events Tracked</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileText className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brand.contentCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Content Posts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <Megaphone className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{brand.campaignsCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Ad Campaigns</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${(brand.budgetConstraints?.monthly || 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Monthly Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tracking">Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Brand Voice */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Voice</CardTitle>
                <CardDescription>
                  AI content generation will follow these guidelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Tone</p>
                  <p className="text-sm text-muted-foreground capitalize">{brandVoice.tone || 'Professional'}</p>
                </div>
                {brandVoice.personality && (
                  <div>
                    <p className="text-sm font-medium">Personality</p>
                    <p className="text-sm text-muted-foreground">{brandVoice.personality}</p>
                  </div>
                )}
                {brandVoice.tagline && (
                  <div>
                    <p className="text-sm font-medium">Tagline</p>
                    <p className="text-sm text-muted-foreground">{brandVoice.tagline}</p>
                  </div>
                )}
                {brandVoice.keywords?.length > 0 && (
                  <div>
                    <p className="text-sm font-medium">Keywords</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {brandVoice.keywords.map((kw: string) => (
                        <span key={kw} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Target Audiences */}
            <Card>
              <CardHeader>
                <CardTitle>Target Audiences</CardTitle>
                <CardDescription>
                  Primary audience segments for marketing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brand.targetAudiences?.length > 0 ? (
                  brand.targetAudiences.map((audience: any, i: number) => (
                    <div key={i} className="p-3 border rounded-lg">
                      <p className="font-medium">{audience.name}</p>
                      {audience.role && (
                        <p className="text-xs text-muted-foreground mt-1">{audience.role}</p>
                      )}
                      {audience.painPoints && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Pain Points:</p>
                          <p className="text-xs text-muted-foreground">{audience.painPoints}</p>
                        </div>
                      )}
                      {audience.goals && (
                        <div className="mt-2">
                          <p className="text-xs font-medium">Goals:</p>
                          <p className="text-xs text-muted-foreground">{audience.goals}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No audiences defined yet. Add them in settings.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-5">
            <Link href={`/brands/${brand.slug}/funding`} className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                    <Wallet className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">Marketing Funds</p>
                    <p className="text-xs text-muted-foreground">Add budget & spend</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/seo`} className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Search className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">SEO Dashboard</p>
                    <p className="text-xs text-muted-foreground">View rankings & tasks</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/content`} className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">Content Hub</p>
                    <p className="text-xs text-muted-foreground">Create & schedule</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/ads`} className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
                    <Megaphone className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium">Ad Campaigns</p>
                    <p className="text-xs text-muted-foreground">Manage paid ads</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/analytics/events`} className="block">
              <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                    <BarChart3 className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">View all events</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="tracking" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tracking Setup</CardTitle>
              <CardDescription>
                Install the tracking code on your website to start collecting data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {brand.settings?.tracking?.trackingId ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Tracking ID</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xl font-mono font-bold">{brand.settings.tracking.trackingId}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => copyToClipboard(brand.settings.tracking.trackingId)}
                        >
                          {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Events Received</p>
                      <p className="text-xl font-bold mt-1">{brand.eventsCount.toLocaleString()}</p>
                    </div>
                  </div>

                  <Button asChild>
                    <Link href={`/brands/${brand.slug}/connect`}>
                      <Code className="mr-2 h-4 w-4" />
                      View Full Tracking Code
                    </Link>
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Tracking is not yet configured for this brand. Set up tracking in the connect page.
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/brands/${brand.slug}/connect`}>
                      <Code className="mr-2 h-4 w-4" />
                      Set Up Tracking
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
