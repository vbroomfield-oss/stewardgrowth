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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserData {
  id: string
  email: string
  firstName: string
  lastName: string
  organizationName: string
}

interface ApiKeyConfig {
  key: string
  label: string
  description: string
  placeholder: string
  category: 'ai' | 'analytics' | 'ads' | 'seo' | 'payments' | 'email' | 'other'
}

const API_KEY_CONFIGS: ApiKeyConfig[] = [
  {
    key: 'ANTHROPIC_API_KEY',
    label: 'Anthropic API Key',
    description: 'Powers AI recommendations, weekly plans, and chat assistant',
    placeholder: 'sk-ant-...',
    category: 'ai',
  },
  {
    key: 'OPENAI_API_KEY',
    label: 'OpenAI API Key',
    description: 'Content generation, image creation (DALL-E), and content AI',
    placeholder: 'sk-...',
    category: 'ai',
  },
  {
    key: 'GOOGLE_ANALYTICS_MEASUREMENT_ID',
    label: 'Google Analytics Measurement ID',
    description: 'Track website analytics (e.g., G-XXXXXXXXXX)',
    placeholder: 'G-XXXXXXXXXX',
    category: 'analytics',
  },
  {
    key: 'GOOGLE_ANALYTICS_API_CREDENTIALS',
    label: 'Google Analytics API Credentials (JSON)',
    description: 'Service account JSON for pulling GA4 data',
    placeholder: '{"type":"service_account",...}',
    category: 'analytics',
  },
  {
    key: 'GOOGLE_SEARCH_CONSOLE_SITE_URL',
    label: 'Google Search Console Site URL',
    description: 'Your verified site URL in Search Console',
    placeholder: 'https://stewardpro.app',
    category: 'seo',
  },
  {
    key: 'GOOGLE_ADS_CUSTOMER_ID',
    label: 'Google Ads Customer ID',
    description: 'Your Google Ads account ID',
    placeholder: '123-456-7890',
    category: 'ads',
  },
  {
    key: 'META_ADS_ACCESS_TOKEN',
    label: 'Meta Ads Access Token',
    description: 'Facebook/Instagram Ads API access token',
    placeholder: 'EAAxxxxxxx...',
    category: 'ads',
  },
  {
    key: 'META_ADS_ACCOUNT_ID',
    label: 'Meta Ads Account ID',
    description: 'Your Meta Ads account ID',
    placeholder: 'act_1234567890',
    category: 'ads',
  },
  {
    key: 'AHREFS_API_KEY',
    label: 'Ahrefs API Key',
    description: 'SEO analysis, backlink checking, keyword research',
    placeholder: 'ahrefs_...',
    category: 'seo',
  },
  {
    key: 'SEMRUSH_API_KEY',
    label: 'SEMrush API Key',
    description: 'Alternative to Ahrefs for SEO data',
    placeholder: 'semrush_...',
    category: 'seo',
  },
  {
    key: 'STRIPE_SECRET_KEY',
    label: 'Stripe Secret Key',
    description: 'Revenue tracking for StewardPro + StewardRing subscriptions',
    placeholder: 'sk_live_...',
    category: 'payments',
  },
  {
    key: 'RESEND_API_KEY',
    label: 'Resend API Key',
    description: 'Email notifications and automated digest emails',
    placeholder: 're_...',
    category: 'email',
  },
  {
    key: 'SENDGRID_API_KEY',
    label: 'SendGrid API Key',
    description: 'Alternative to Resend for email sending',
    placeholder: 'SG....',
    category: 'email',
  },
  {
    key: 'TELNYX_API_KEY',
    label: 'Telnyx API Key',
    description: 'StewardRing call analytics and tracking',
    placeholder: 'KEY...',
    category: 'other',
  },
  {
    key: 'AMAZON_KDP',
    label: 'Amazon KDP Credentials',
    description: 'Book sales data import (placeholder for future integration)',
    placeholder: 'Connection details...',
    category: 'other',
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  ai: 'AI Services',
  analytics: 'Analytics',
  ads: 'Ad Platforms',
  seo: 'SEO Tools',
  payments: 'Payments & Revenue',
  email: 'Email',
  other: 'Other Integrations',
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<Record<string, { isSet: boolean; preview: string }>>({})
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  const [showValues, setShowValues] = useState<Record<string, boolean>>({})
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, settingsRes] = await Promise.all([
          fetch('/api/user', { credentials: 'include' }),
          fetch('/api/settings', { credentials: 'include' }),
        ])

        if (userRes.ok) {
          const data = await userRes.json()
          setUser(data.user || null)
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json()
          setSettings(data.settings || {})
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
        alert(data.error || 'Failed to save')
      }
    } catch (err) {
      alert('Failed to save API key')
    } finally {
      setSaving(null)
    }
  }

  async function handleRemoveKey(key: string) {
    if (!confirm(`Remove ${key}? This will disable the integration.`)) return
    await handleSaveKey(key, '')
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
                  Enter your API keys below to enable integrations. Keys are encrypted and stored securely in your organization settings.
                </p>
              </div>
            </div>
          </div>

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

                    return (
                      <div
                        key={config.key}
                        className={cn(
                          'p-4 border rounded-lg transition-colors',
                          isSet
                            ? 'border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20'
                            : 'border-dashed'
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{config.label}</p>
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
              <Button className="mt-4" disabled>
                <Plus className="mr-2 h-4 w-4" />
                Invite Team Member
              </Button>
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
              <Button className="mt-4" disabled>
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
              <Button className="mt-4" disabled>
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
              <div className="text-center py-8 text-muted-foreground">
                <Key className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No API keys created yet</p>
                <p className="text-sm mt-1">Create an API key to start tracking events</p>
              </div>
              <Button className="mt-4" disabled>
                <Plus className="mr-2 h-4 w-4" />
                Create API Key
              </Button>
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
