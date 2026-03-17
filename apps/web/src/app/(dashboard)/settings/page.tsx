'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Link2,
  CreditCard,
  Plus,
  Copy,
  Loader2,
  User,
  Building2,
  Key,
  Check,
  Eye,
  EyeOff,
  Save,
  Shield,
  Trash2,
  Send,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  organizationName: string
}

interface BrandGA4 {
  name: string
  slug: string
  ga4PropertyId: string | null
}

interface ApiKeyConfig {
  key: string
  label: string
  description: string
  placeholder: string
  category: 'ai' | 'analytics' | 'ads' | 'seo' | 'payments' | 'email' | 'other'
}

interface CreatedApiKey {
  id: string
  name: string
  keyPrefix: string
  createdAt: string
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  // Priority: Keys you need to add soon
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Stripe Secret Key',
    description: 'Revenue tracking for StewardPro + StewardRing subscriptions. Get from Stripe Dashboard > Developers > API Keys.',
    placeholder: 'sk_live_...',
    category: 'payments',
  },
  {
    key: 'TELNYX_API_KEY',
    label: 'Telnyx API Key',
    description: 'StewardRing call analytics. Copy from StewardRing Railway environment variables.',
    placeholder: 'KEY...',
    category: 'other',
  },
  {
    key: 'GOOGLE_ANALYTICS_MEASUREMENT_ID',
    label: 'Google Analytics Property ID (Default Fallback)',
    description: 'Fallback GA4 Measurement ID used when a brand does not have its own. Each brand can override this in Brand Settings > API Keys.',
    placeholder: 'G-XXXXXXXXXX',
    category: 'analytics',
  },
  {
    key: 'GOOGLE_ANALYTICS_API_CREDENTIALS',
    label: 'Google Application Credentials (JSON)',
    description: 'Service account JSON for pulling GA4 data. Create in Google Cloud Console > IAM > Service Accounts.',
    placeholder: '{"type":"service_account",...}',
    category: 'analytics',
  },
  {
    key: 'GOOGLE_SEARCH_CONSOLE_SITE_URL',
    label: 'Google Search Console Site URL',
    description: 'Your verified site URL for SEO data. Add your site at search.google.com/search-console.',
    placeholder: 'https://stewardpro.app',
    category: 'analytics',
  },
]

const COMING_SOON_KEYS = [
  { label: 'Google Ads Customer ID', description: 'Ad campaign performance tracking' },
  { label: 'Meta Ads Access Token', description: 'Facebook/Instagram ad analytics' },
  { label: 'SEMrush API Key', description: 'SEO keyword research and analysis' },
  { label: 'Amazon KDP Integration', description: 'Book sales data import' },
]

const CATEGORY_LABELS: Record<string, string> = {
  analytics: 'Analytics & Search',
  payments: 'Payments & Revenue',
  other: 'Communications',
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, { isSet: boolean; preview: string }>>({})
  const [brandGA4s, setBrandGA4s] = useState<BrandGA4[]>([])
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // 7A: Invite Team Member state
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)

  // Service Health state
  const [serviceHealth, setServiceHealth] = useState<Array<{
    name: string
    configured: boolean
    status: 'ok' | 'warning' | 'critical' | 'unconfigured' | 'checking'
    remaining?: number
    limit?: number
    unit?: string
    error?: string
  }>>([])
  const [healthLoading, setHealthLoading] = useState(false)

  // 7B: Create API Key state
  const [showApiKeyForm, setShowApiKeyForm] = useState(false)
  const [apiKeyName, setApiKeyName] = useState('')
  const [creatingKey, setCreatingKey] = useState(false)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [createdKeys, setCreatedKeys] = useState<CreatedApiKey[]>([])
  const [keyCopied, setKeyCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, settingsRes, brandsRes] = await Promise.all([
          fetch('/api/user', { credentials: 'include' }),
          fetch('/api/settings', { credentials: 'include' }),
          fetch('/api/brands', { credentials: 'include' }),
        ])

        if (userRes.ok) {
          const data = await userRes.json()
          setUser(data.user || null)
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data.settings || {})
        }

        if (brandsRes.ok) {
          const data = await brandsRes.json()
          const brands = data.brands || []
          setBrandGA4s(brands.map((b: any) => ({ name: b.name, slug: b.slug, ga4PropertyId: b.ga4PropertyId || null })))
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  async function handleSaveKey(key: string, value: string) {
    setSaving(key)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ key, value }),
      })

      if (res.ok) {
        // Refresh settings
        const settingsRes = await fetch('/api/settings', { credentials: 'include' })
        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data.settings || {})
        }
        setEditingKey(null)
        setEditValue('')
        setSaveSuccess(key)
        setTimeout(() => setSaveSuccess(null), 3000)
      } else {
        const data = await res.json()
        toast({ title: 'Error', description: data.error || 'Failed to save', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save API key', variant: 'destructive' })
    } finally {
      setSaving(null)
    }
  }

  async function handleRemoveKey(key: string) {
    if (!confirm(`Remove ${key}? This will disable the integration.`)) return
    await handleSaveKey(key, '')
  }

  // 7A: Send team invite
  async function handleSendInvite() {
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({ title: 'Invalid email', description: 'Please enter a valid email address', variant: 'destructive' })
      return
    }

    setInviting(true)
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: inviteEmail }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({ title: 'Invitation sent', description: `An invite has been sent to ${inviteEmail}` })
        setInviteEmail('')
        setShowInviteForm(false)
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send invitation', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to send invitation', variant: 'destructive' })
    } finally {
      setInviting(false)
    }
  }

  // 7B: Create API key
  async function handleCreateApiKey() {
    if (!apiKeyName.trim()) {
      toast({ title: 'Name required', description: 'Please enter a name for the API key', variant: 'destructive' })
      return
    }

    setCreatingKey(true)
    try {
      const res = await fetch('/api/keys/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: apiKeyName.trim() }),
      })

      const data = await res.json()

      if (res.ok) {
        setNewApiKey(data.key)
        setCreatedKeys((prev) => [...prev, data.apiKey])
        setApiKeyName('')
        setShowApiKeyForm(false)
        toast({ title: 'API key created', description: 'Make sure to copy your key now. It will not be shown again.' })
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to create API key', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to create API key', variant: 'destructive' })
    } finally {
      setCreatingKey(false)
    }
  }

  // 7C: Upgrade plan
  async function handleUpgradePlan() {
    const stripeConfigured = settings['STRIPE_SECRET_KEY']?.isSet
    if (!stripeConfigured) {
      toast({
        title: 'Stripe not configured',
        description: 'Configure Stripe in environment variables to enable billing',
        variant: 'destructive',
      })
      return
    }

    // Stripe is configured — redirect to checkout
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      const data = await res.json()

      if (res.ok && data.url) {
        window.location.href = data.url
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to start checkout', variant: 'destructive' })
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to start checkout session', variant: 'destructive' })
    }
  }

  // 7D: Add funds
  function handleAddFunds() {
    toast({
      title: 'Stripe required',
      description: 'Marketing fund deposits require a connected Stripe account. Configure Stripe in Settings > Integrations to enable this feature.',
    })
  }

  // Copy to clipboard helper
  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setKeyCopied(true)
      setTimeout(() => setKeyCopied(false), 2000)
      toast({ title: 'Copied', description: 'API key copied to clipboard' })
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const categories = [...new Set(API_KEY_CONFIGS.map((c) => c.category))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, API keys, and integrations
        </p>
      </div>

      <Tabs defaultValue="integrations">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="health">Service Health</TabsTrigger>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        {/* Integrations Tab — API Key Management */}
        <TabsContent value="integrations" className="space-y-6 mt-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-300">API Key Management</p>
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  Enter your API keys below to enable integrations. Keys are stored securely in your organization settings.
                  Keys marked "Connected via Vercel" are set as environment variables and work automatically.
                </p>
              </div>
            </div>
          </div>

          {/* Already Connected via Vercel Env Vars */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                Connected Services (via Vercel)
              </CardTitle>
              <CardDescription>
                These are configured as environment variables in your Vercel deployment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: 'Anthropic API (Claude)', key: 'ANTHROPIC_API_KEY', desc: 'AI recommendations, weekly plans, chat assistant' },
                { name: 'OpenAI API', key: 'OPENAI_API_KEY', desc: 'Content generation, image creation (DALL-E)' },
                { name: 'Resend Email', key: 'RESEND_API_KEY', desc: 'Email notifications and digest emails' },
                { name: 'Supabase Auth & Storage', key: 'SUPABASE', desc: 'Authentication, file uploads, database' },
                { name: 'Cron Jobs', key: 'CRON_SECRET', desc: 'Scheduled content generation and publishing' },
              ].map((svc) => (
                <div key={svc.key} className="flex items-center justify-between p-3 border border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{svc.name}</p>
                      <p className="text-xs text-muted-foreground">{svc.desc}</p>
                    </div>
                  </div>
                  <span className="text-xs text-green-700 dark:text-green-400 shrink-0">Connected</span>
                </div>
              ))}
            </CardContent>
          </Card>

          {categories.map((category) => {
            const configs = API_KEY_CONFIGS.filter((c) => c.category === category)
            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">{CATEGORY_LABELS[category]}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {configs.map((config) => {
                    const isSet = settings[config.key]?.isSet || false
                    const isEditing = editingKey === config.key
                    const isSaving = saving === config.key
                    const justSaved = saveSuccess === config.key

                    // For GA4 field, check if brands already have their own IDs
                    const isGA4Field = config.key === 'GOOGLE_ANALYTICS_MEASUREMENT_ID'
                    const brandsWithGA4 = brandGA4s.filter(b => b.ga4PropertyId)
                    const allBrandsHaveGA4 = brandGA4s.length > 0 && brandsWithGA4.length === brandGA4s.length

                    return (
                      <div
                        key={config.key}
                        className={cn(
                          'p-4 border rounded-lg transition-colors',
                          isGA4Field && allBrandsHaveGA4
                            ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                            : isSet
                              ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                              : 'border-dashed'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{config.label}</p>
                              {isGA4Field && allBrandsHaveGA4 && !isSet && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                                  <Check className="h-3 w-3" /> All Brands Configured
                                </span>
                              )}
                              {isSet && (
                                <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                                  <Check className="h-3 w-3" /> Connected
                                </span>
                              )}
                              {justSaved && (
                                <span className="text-xs text-green-600 animate-pulse">Saved!</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {config.description}
                            </p>

                            {/* Show per-brand GA4 status */}
                            {isGA4Field && brandGA4s.length > 0 && (
                              <div className="mt-3 space-y-1.5">
                                {brandGA4s.map((b) => (
                                  <div key={b.slug} className="flex items-center gap-2 text-sm">
                                    {b.ga4PropertyId ? (
                                      <Check className="h-3.5 w-3.5 text-green-600 shrink-0" />
                                    ) : (
                                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                    )}
                                    <span className="font-medium">{b.name}</span>
                                    {b.ga4PropertyId ? (
                                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-green-700 dark:text-green-400">
                                        {b.ga4PropertyId}
                                      </code>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">
                                        Not set — <a href={`/brands/${b.slug}/settings`} className="underline hover:text-primary">configure in Brand Settings</a>
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {allBrandsHaveGA4 && !isSet && (
                                  <p className="text-xs text-green-700 dark:text-green-400 mt-2">
                                    All brands have their own GA4 IDs — no fallback needed.
                                  </p>
                                )}
                              </div>
                            )}

                            {isSet && !isEditing && (
                              <div className="flex items-center gap-2 mt-2">
                                <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                                  {showValues[config.key]
                                    ? settings[config.key]?.preview
                                    : '••••••••••••'}
                                </code>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    setShowValues((prev) => ({
                                      ...prev,
                                      [config.key]: !prev[config.key],
                                    }))
                                  }
                                >
                                  {showValues[config.key] ? (
                                    <EyeOff className="h-3 w-3" />
                                  ) : (
                                    <Eye className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingKey(null)
                                    setEditValue('')
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveKey(config.key, editValue)}
                                  disabled={!editValue.trim() || isSaving}
                                >
                                  {isSaving ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <Save className="mr-1 h-3 w-3" />
                                      Save
                                    </>
                                  )}
                                </Button>
                              </>
                            ) : (
                              <>
                                {isSet && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-red-600 hover:text-red-700"
                                    onClick={() => handleRemoveKey(config.key)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                                {/* Hide "Add Key" for GA4 when all brands are configured */}
                                {!(isGA4Field && allBrandsHaveGA4 && !isSet) && (
                                  <Button
                                    size="sm"
                                    variant={isSet ? 'outline' : 'default'}
                                    onClick={() => {
                                      setEditingKey(config.key)
                                      setEditValue('')
                                    }}
                                  >
                                    {isSet ? 'Update' : 'Add Key'}
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {isEditing && (
                          <div className="mt-3">
                            <Input
                              type="password"
                              placeholder={config.placeholder}
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editValue.trim()) {
                                  handleSaveKey(config.key, editValue)
                                }
                              }}
                              autoFocus
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )
          })}

          {/* Coming Soon */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-muted-foreground">Coming Soon</CardTitle>
              <CardDescription>Future integrations being developed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMING_SOON_KEYS.map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 border border-dashed rounded-lg opacity-60">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">Coming Soon</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Service Health Tab */}
        <TabsContent value="health" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Service Health & Quotas</CardTitle>
                  <CardDescription>
                    Monitor the status and remaining quota of external APIs used for content and video generation
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    setHealthLoading(true)
                    try {
                      const res = await fetch('/api/settings/service-health', { credentials: 'include' })
                      if (res.ok) {
                        const data = await res.json()
                        setServiceHealth(data.services || [])
                      }
                    } catch (err) {
                      console.error('Failed to check health:', err)
                    } finally {
                      setHealthLoading(false)
                    }
                  }}
                  disabled={healthLoading}
                >
                  {healthLoading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Checking...</>
                  ) : (
                    'Check Now'
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {serviceHealth.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-3 opacity-50" />
                  <p>Click &quot;Check Now&quot; to check the status of your external services</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {serviceHealth.map((service) => (
                    <div
                      key={service.name}
                      className={cn(
                        "p-4 rounded-lg border",
                        service.status === 'critical' && "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
                        service.status === 'warning' && "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
                        service.status === 'ok' && "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
                        service.status === 'unconfigured' && "bg-muted/50 border-muted",
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-2.5 w-2.5 rounded-full",
                            service.status === 'critical' && "bg-red-500",
                            service.status === 'warning' && "bg-yellow-500",
                            service.status === 'ok' && "bg-green-500",
                            service.status === 'unconfigured' && "bg-gray-400",
                          )} />
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded",
                          service.status === 'critical' && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
                          service.status === 'warning' && "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
                          service.status === 'ok' && "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
                          service.status === 'unconfigured' && "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                        )}>
                          {service.status === 'ok' ? 'Healthy' : service.status === 'unconfigured' ? 'Not Configured' : service.status.toUpperCase()}
                        </span>
                      </div>

                      {service.remaining !== undefined && service.limit !== undefined && service.limit > 0 && (
                        <>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-3">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                service.status === 'critical' && "bg-red-500",
                                service.status === 'warning' && "bg-yellow-500",
                                service.status === 'ok' && "bg-green-500",
                              )}
                              style={{ width: `${Math.max(Math.round((service.remaining / service.limit) * 100), 1)}%` }}
                            />
                          </div>
                          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                            <span>{service.remaining.toLocaleString()} {service.unit} remaining</span>
                            <span>{service.limit.toLocaleString()} total</span>
                          </div>
                        </>
                      )}

                      {service.unit && !service.limit && service.status !== 'unconfigured' && (
                        <p className="text-xs text-muted-foreground mt-1">{service.unit}</p>
                      )}

                      {service.error && (
                        <p className="text-xs text-red-600 dark:text-red-400 mt-2">{service.error}</p>
                      )}

                      {service.status === 'unconfigured' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Add the API key in your Vercel environment variables to enable this service
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
              <CardDescription>
                Manage your organization information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Organization Name</label>
                <Input defaultValue={user?.organizationName || ''} placeholder="Your organization name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Admin Email</label>
                <Input defaultValue={user?.email || ''} type="email" disabled />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage who has access to your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user && (
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{user.firstName} {user.lastName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full capitalize bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                      owner
                    </span>
                  </div>
                )}
              </div>

              {/* Invite Form */}
              {showInviteForm ? (
                <div className="mt-4 p-4 border border-dashed rounded-lg space-y-3">
                  <label className="text-sm font-medium block">Email address</label>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="colleague@example.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inviteEmail.includes('@')) {
                          handleSendInvite()
                        }
                      }}
                      autoFocus
                      disabled={inviting}
                    />
                    <Button onClick={handleSendInvite} disabled={inviting || !inviteEmail.includes('@')}>
                      {inviting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Invite
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowInviteForm(false)
                        setInviteEmail('')
                      }}
                      disabled={inviting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="mt-4" onClick={() => setShowInviteForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Invite Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-blue-700 dark:text-blue-400">
                      Free Plan
                    </h3>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      Get started with basic features
                    </p>
                  </div>
                  <span className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                    $0
                    <span className="text-sm font-normal">/mo</span>
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                Upgrade to unlock advanced features, more brands, and premium support.
              </p>
              <Button className="mt-4" onClick={handleUpgradePlan}>
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Marketing Fund</CardTitle>
              <CardDescription>
                Your pre-funded marketing budget
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Available Balance</p>
                  <p className="text-2xl font-bold">$0</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Reserved</p>
                  <p className="text-2xl font-bold">$0</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">This Month Spend</p>
                  <p className="text-2xl font-bold">$0</p>
                </div>
              </div>
              <Button className="mt-4" onClick={handleAddFunds}>
                <CreditCard className="mr-2 h-4 w-4" />
                Add Funds
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Tab */}
        <TabsContent value="api" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>
                Manage API keys for event tracking and integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show newly created key */}
              {newApiKey && (
                <div className="mb-6 p-4 border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      Save this — it won&apos;t be shown again
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-white dark:bg-gray-900 px-3 py-2 rounded border font-mono break-all">
                      {newApiKey}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newApiKey)}
                    >
                      {keyCopied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-700"
                    onClick={() => setNewApiKey(null)}
                  >
                    I&apos;ve saved it — dismiss
                  </Button>
                </div>
              )}

              {/* List of created keys */}
              {createdKeys.length > 0 ? (
                <div className="space-y-3 mb-6">
                  {createdKeys.map((key) => (
                    <div key={key.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{key.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {key.keyPrefix}••••••••
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Created {new Date(key.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No API keys created yet</p>
                  <p className="text-sm mt-1">Create an API key to start tracking events</p>
                </div>
              )}

              {/* Create API Key Form */}
              {showApiKeyForm ? (
                <div className="mt-4 p-4 border border-dashed rounded-lg space-y-3">
                  <label className="text-sm font-medium block">API Key Name</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="e.g., Production, Staging, My App"
                      value={apiKeyName}
                      onChange={(e) => setApiKeyName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && apiKeyName.trim()) {
                          handleCreateApiKey()
                        }
                      }}
                      autoFocus
                      disabled={creatingKey}
                    />
                    <Button onClick={handleCreateApiKey} disabled={creatingKey || !apiKeyName.trim()}>
                      {creatingKey ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create'
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowApiKeyForm(false)
                        setApiKeyName('')
                      }}
                      disabled={creatingKey}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="mt-4" onClick={() => setShowApiKeyForm(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create API Key
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Tracking SDK</CardTitle>
              <CardDescription>
                Install the tracking snippet on your SaaS products
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-muted-foreground text-sm">
                  Add a brand first to get your tracking snippet
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
