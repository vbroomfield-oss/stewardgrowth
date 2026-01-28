'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
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
} from 'lucide-react'
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
}

export default function BrandSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const slug = params.slug as string

  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedKey, setCopiedKey] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    description: '',
    color: '#6366f1',
    timezone: 'America/New_York',
    currency: 'USD',
    brandVoicePersonality: '',
  })

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
      setFormData({
        name: result.brand.name || '',
        domain: result.brand.domain || '',
        description: result.brand.description || '',
        color: result.brand.color || '#6366f1',
        timezone: result.brand.settings?.timezone || 'America/New_York',
        currency: result.brand.settings?.currency || 'USD',
        brandVoicePersonality: result.brand.brandVoice?.personality || '',
      })
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
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

      <Tabs defaultValue="general" className="space-y-6">
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
