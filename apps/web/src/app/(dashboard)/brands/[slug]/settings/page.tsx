'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import {
  Settings,
  Building2,
  Palette,
  Key,
  Trash2,
  Save,
  Globe,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Image,
  Scan,
  Sparkles,
  Upload,
  Share2,
  ExternalLink,
  Unplug,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPlatformColor, getPlatformIcon } from '@/components/social/platform-preview'
import { PageSelectorModal } from '@/components/social/page-selector-modal'
import Link from 'next/link'

interface Brand {
  id: string
  name: string
  slug: string
  domain: string | null
  color: string
  description: string
  industry: string
  brandVoice: any
  settings: any
  ga4PropertyId: string | null
}

interface PlatformConnection {
  id: string
  platform: string
  status: string
  accountName: string | null
  lastSyncAt: string | null
  lastError: string | null
}

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

function BrandSettingsContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const slug = params.slug as string
  const initialTab = searchParams.get('tab') || 'general'

  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoStatus, setLogoStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle')
  const [socialConnections, setSocialConnections] = useState<PlatformConnection[]>([])
  const [disconnectingPlatform, setDisconnectingPlatform] = useState<string | null>(null)
  const [pageSelectorPlatform, setPageSelectorPlatform] = useState<'facebook' | 'instagram' | 'linkedin' | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    color: '#6366f1',
    timezone: 'America/New_York',
    currency: 'USD',
    brandVoicePersonality: '',
    logoUrl: '',
    ga4PropertyId: '',
  })

  useEffect(() => {
    fetchBrand()
  }, [slug])

  // Show toast for OAuth callback results and handle page/org selection
  useEffect(() => {
    const success = searchParams.get('success')
    const oauthError = searchParams.get('error')
    const selectPage = searchParams.get('selectPage')
    const selectOrg = searchParams.get('selectOrg')

    if (success) {
      const platform = success.replace('_connected', '').replace('_', ' ')
      toast({ title: 'Connected!', description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} has been connected successfully.` })
    }
    if (oauthError) {
      toast({ title: 'Connection Failed', description: `OAuth error: ${oauthError}`, variant: 'destructive' })
    }
    if (selectPage === 'facebook' || selectPage === 'instagram') {
      setPageSelectorPlatform(selectPage)
    }
    if (selectOrg === 'linkedin') {
      setPageSelectorPlatform('linkedin')
    }
  }, [searchParams])

  const fetchBrand = async () => {
    try {
      const response = await fetch(`/api/brands/${slug}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch brand')
      }

      setBrand(result.brand)
      const logoUrl = result.brand.logo || result.brand.settings?.logoUrl || ''
      setFormData({
        name: result.brand.name || '',
        domain: result.brand.domain || '',
        description: result.brand.description || '',
        color: result.brand.color || '#6366f1',
        timezone: result.brand.settings?.timezone || 'America/New_York',
        currency: result.brand.settings?.currency || 'USD',
        brandVoicePersonality: result.brand.brandVoice?.personality || '',
        logoUrl,
        ga4PropertyId: result.brand.ga4PropertyId || '',
      })
      if (logoUrl) {
        setLogoStatus('loading')
      }

      // Fetch social connections for this brand
      try {
        const connRes = await fetch(`/api/platforms?brandId=${result.brand.id}`, { credentials: 'include' })
        if (connRes.ok) {
          const connData = await connRes.json()
          setSocialConnections(connData.data || [])
        }
      } catch {
        // Non-blocking
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const getConnection = (platformKey: string): PlatformConnection | undefined => {
    return socialConnections.find(
      (c) => c.platform === platformKey && c.status !== 'DISCONNECTED'
    )
  }

  const handleDisconnectPlatform = async (connectionId: string) => {
    if (!confirm('Disconnect this platform? You can reconnect anytime.')) return
    setDisconnectingPlatform(connectionId)
    try {
      const res = await fetch(`/api/platforms?id=${connectionId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'Disconnected', description: 'Platform has been disconnected.' })
        // Refresh connections
        if (brand) {
          const connRes = await fetch(`/api/platforms?brandId=${brand.id}`, { credentials: 'include' })
          if (connRes.ok) {
            const connData = await connRes.json()
            setSocialConnections(connData.data || [])
          }
        }
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to disconnect', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to disconnect platform', variant: 'destructive' })
    } finally {
      setDisconnectingPlatform(null)
    }
  }

  const handleConnectPlatform = (oauthKey: string) => {
    if (!brand) return
    window.location.href = `/api/oauth/${oauthKey}/authorize?brandId=${brand.id}`
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/brands/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          domain: formData.domain,
          description: formData.description,
          color: formData.color,
          timezone: formData.timezone,
          currency: formData.currency,
          logoUrl: formData.logoUrl,
          ga4PropertyId: formData.ga4PropertyId,
          brandVoice: {
            ...brand?.brandVoice,
            personality: formData.brandVoicePersonality,
          },
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save changes')
      }

      toast({
        title: 'Settings saved',
        description: 'Your brand settings have been updated.',
      })
    } catch (err: any) {
      toast({
        title: 'Error saving settings',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/brands/${slug}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete brand')
      }

      toast({
        title: 'Brand deleted',
        description: 'The brand has been permanently deleted.',
      })

      router.push('/brands')
    } catch (err: any) {
      toast({
        title: 'Error deleting brand',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogoUpload = async (file: File) => {
    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'brand-logo')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to upload logo')
      }

      // Update form with new URL
      setFormData(prev => ({ ...prev, logoUrl: result.url }))
      setLogoStatus('loading')

      toast({
        title: 'Logo uploaded',
        description: 'Your logo has been uploaded successfully.',
      })
    } catch (err: any) {
      toast({
        title: 'Upload failed',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleAnalyzeLandingPage = async () => {
    if (!formData.domain) {
      toast({
        title: 'Domain required',
        description: 'Please enter a domain first to analyze your landing page.',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/brands/analyze-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: brand?.id,
          domain: formData.domain,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze landing page')
      }

      // Update form with extracted data
      if (result.data) {
        setFormData(prev => ({
          ...prev,
          logoUrl: result.data.logoUrl || prev.logoUrl,
          color: result.data.primaryColor || prev.color,
          description: result.data.description || prev.description,
          brandVoicePersonality: result.data.brandVoice || prev.brandVoicePersonality,
        }))
      }

      toast({
        title: 'Landing page analyzed',
        description: 'Brand identity extracted! Review the changes and click Save.',
      })
    } catch (err: any) {
      toast({
        title: 'Analysis failed',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const copyToClipboard = (text: string, type: 'key' | 'id') => {
    navigator.clipboard.writeText(text)
    if (type === 'key') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
    } else {
      setCopiedId(true)
      setTimeout(() => setCopiedId(false), 2000)
    }
    toast({
      title: 'Copied to clipboard',
    })
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/brands/${slug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Settings className="h-8 w-8 text-muted-foreground" />
            Brand Settings
          </h1>
          <p className="text-muted-foreground">
            Configure settings for {brand.name}
          </p>
        </div>
      </div>

      <Tabs defaultValue={initialTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Building2 className="h-4 w-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            Branding
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="social">
            <Share2 className="h-4 w-4 mr-2" />
            Social
          </TabsTrigger>
          <TabsTrigger value="danger">
            <Trash2 className="h-4 w-4 mr-2" />
            Danger Zone
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
              <CardDescription>Basic information about your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Brand Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-sm text-muted-foreground">
                      /brands/
                    </span>
                    <Input
                      id="slug"
                      value={brand.slug}
                      disabled
                      className="rounded-l-none bg-muted"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Slug cannot be changed</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Primary Domain</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <Input
                    id="domain"
                    placeholder="example.com"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (&euro;)</option>
                    <option value="GBP">GBP (&pound;)</option>
                    <option value="CAD">CAD (C$)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Settings */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Brand Identity</CardTitle>
              <CardDescription>Customize your brand&apos;s visual identity and voice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Auto-Extract from Landing Page */}
              <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-800 rounded-lg">
                    <Sparkles className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">
                      Auto-Extract Brand Identity
                    </h3>
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                      Analyze your landing page to automatically extract your logo, brand colors, and messaging.
                    </p>
                    <Button
                      className="mt-3"
                      variant="outline"
                      onClick={handleAnalyzeLandingPage}
                      disabled={isAnalyzing || !formData.domain}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Scan className="mr-2 h-4 w-4" />
                          Analyze Landing Page
                        </>
                      )}
                    </Button>
                    {!formData.domain && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        Add your domain in General settings first
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Logo URL */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Brand Logo
                </Label>
                <div className="flex items-start gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={formData.logoUrl}
                        onChange={(e) => {
                          setFormData({ ...formData, logoUrl: e.target.value })
                          setLogoStatus(e.target.value ? 'loading' : 'idle')
                        }}
                        className="flex-1"
                      />
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleLogoUpload(file)
                        }}
                        className="hidden"
                        id="logo-upload"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('logo-upload')?.click()}
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Upload
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Paste a URL or upload a PNG/JPG file (max 5MB). Used in AI-generated marketing content.
                    </p>
                  </div>
                  {formData.logoUrl && (
                    <div className="w-20 h-20 border rounded-lg bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
                      {logoStatus === 'loading' && (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      )}
                      {logoStatus === 'error' && (
                        <div className="text-center p-1">
                          <AlertCircle className="h-5 w-5 text-red-500 mx-auto" />
                          <p className="text-[10px] text-red-500 mt-1">Failed</p>
                        </div>
                      )}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.logoUrl}
                        alt="Logo preview"
                        className={`max-w-full max-h-full object-contain ${logoStatus === 'loaded' ? '' : 'hidden'}`}
                        onLoad={() => setLogoStatus('loaded')}
                        onError={() => setLogoStatus('error')}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Brand Color */}
              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-12 h-12 rounded-lg border cursor-pointer"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-32"
                  />
                </div>
              </div>

              {/* Brand Voice */}
              <div className="space-y-2">
                <Label>Brand Voice (AI Content)</Label>
                <Textarea
                  placeholder="Describe your brand's tone and voice for AI-generated content..."
                  value={formData.brandVoicePersonality}
                  onChange={(e) => setFormData({ ...formData, brandVoicePersonality: e.target.value })}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This helps the AI generate content that matches your brand personality
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="integrations">
          {/* Google Analytics Integration */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Google Analytics</CardTitle>
              <CardDescription>
                Connect this brand to its own GA4 property for independent analytics tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ga4PropertyId">GA4 Measurement ID</Label>
                <Input
                  id="ga4PropertyId"
                  placeholder="G-XXXXXXXXXX"
                  value={formData.ga4PropertyId}
                  onChange={(e) => setFormData({ ...formData, ga4PropertyId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Find this in GA4 &gt; Admin &gt; Data Streams &gt; your stream &gt; Measurement ID.
                  Each brand should have its own GA4 property for isolated analytics.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving} size="sm">
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Your tracking credentials for this brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">Tracking ID</p>
                      <p className="text-sm text-muted-foreground">Use this ID in your tracking code</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={brand.settings?.tracking?.trackingId || 'Not set'}
                      readOnly
                      className="font-mono text-sm bg-muted"
                    />
                    {brand.settings?.tracking?.trackingId && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(brand.settings.tracking.trackingId, 'id')}
                      >
                        {copiedId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-medium">API Key</p>
                      <p className="text-sm text-muted-foreground">Use this key to authenticate API requests</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={brand.settings?.tracking?.apiKey || 'Not set'}
                      readOnly
                      className="font-mono text-sm bg-muted"
                    />
                    {brand.settings?.tracking?.apiKey && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(brand.settings.tracking.apiKey, 'key')}
                      >
                        {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Need help?</strong> View the full tracking code and installation instructions on the{' '}
                  <Link href={`/brands/${slug}/connect`} className="underline">
                    Connect page
                  </Link>
                  .
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Connections */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Accounts</CardTitle>
              <CardDescription>
                Connect social platforms to publish content directly from StewardGrowth.
                {' '}{socialConnections.filter(c => c.status === 'CONNECTED').length} of {SOCIAL_PLATFORMS.length} connected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Brand Account Guidance Banner */}
              <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Connect each brand to its own social accounts
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  When you click Connect, you&apos;ll be asked to log in. <strong>Use {brand.name}&apos;s social media login</strong> — not your personal account.
                  For Facebook/Instagram, log into the account that manages {brand.name}&apos;s Page. This ensures all posts go out from the brand&apos;s perspective.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const connection = getConnection(platform.key)
                  const isConnected = connection?.status === 'CONNECTED'
                  const hasError = connection?.status === 'ERROR' || connection?.status === 'EXPIRED'

                  // Determine connection type from stored credentials (fetched via API)
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
                            onClick={() => handleDisconnectPlatform(connection!.id)}
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
                            onClick={() => handleConnectPlatform(platform.oauthKey)}
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

          {/* Page/Account Selector Modal */}
          {pageSelectorPlatform && brand && (
            <PageSelectorModal
              platform={pageSelectorPlatform}
              brandId={brand.id}
              onSelect={(selected) => {
                toast({
                  title: 'Account Updated',
                  description: `Now posting as: ${selected.name}`,
                })
                setPageSelectorPlatform(null)
                // Refresh connections
                fetchBrand()
              }}
              onClose={() => setPageSelectorPlatform(null)}
            />
          )}
        </TabsContent>

        {/* Danger Zone */}
        <TabsContent value="danger">
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions for this brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                <div>
                  <p className="font-medium text-destructive">Delete Brand</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this brand and all its data. This cannot be undone.
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Brand'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function BrandSettingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <BrandSettingsContent />
    </Suspense>
  )
}
