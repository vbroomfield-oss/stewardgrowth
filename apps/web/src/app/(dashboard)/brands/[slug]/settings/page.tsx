'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Settings,
  Building2,
  Palette,
  Bell,
  Key,
  Users,
  Trash2,
  Save,
  Globe,
  Link as LinkIcon,
  Shield,
  CreditCard,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'

// Mock brand data
const mockBrand = {
  name: 'StewardMAX',
  slug: 'stewardmax',
  website: 'https://stewardmax.com',
  description: 'Church management software for modern ministries',
  industry: 'SaaS - Religious/Non-profit',
  color: '#6366f1',
  logo: null,
  timezone: 'America/New_York',
  currency: 'USD',
}

export default function BrandSettingsPage() {
  const params = useParams()
  const slug = params.slug as string

  const [brand, setBrand] = useState(mockBrand)
  const [notifications, setNotifications] = useState({
    weeklyReport: true,
    budgetAlerts: true,
    campaignUpdates: true,
    seoAlerts: false,
    aiRecommendations: true,
  })

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
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Key className="h-4 w-4 mr-2" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
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
                    value={brand.name}
                    onChange={(e) => setBrand({ ...brand, name: e.target.value })}
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
                      onChange={(e) => setBrand({ ...brand, slug: e.target.value })}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website URL</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </span>
                  <Input
                    id="website"
                    value={brand.website}
                    onChange={(e) => setBrand({ ...brand, website: e.target.value })}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={brand.description}
                  onChange={(e) => setBrand({ ...brand, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={brand.timezone}
                    onChange={(e) => setBrand({ ...brand, timezone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={brand.currency}
                    onChange={(e) => setBrand({ ...brand, currency: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
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
              <CardDescription>Customize your brand&apos;s visual identity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Brand Color</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={brand.color}
                    onChange={(e) => setBrand({ ...brand, color: e.target.value })}
                    className="w-12 h-12 rounded-lg border cursor-pointer"
                  />
                  <Input
                    value={brand.color}
                    onChange={(e) => setBrand({ ...brand, color: e.target.value })}
                    className="w-32"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand Logo</Label>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Drag and drop your logo here, or click to browse
                    </p>
                    <Button variant="outline" size="sm">
                      Upload Logo
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Brand Voice (AI Content)</Label>
                <Textarea
                  placeholder="Describe your brand's tone and voice for AI-generated content..."
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This helps the AI generate content that matches your brand personality
                </p>
              </div>

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'weeklyReport', label: 'Weekly Performance Report', description: 'Get a summary of your marketing metrics every Monday' },
                { key: 'budgetAlerts', label: 'Budget Alerts', description: 'Notify when campaigns approach or exceed budget limits' },
                { key: 'campaignUpdates', label: 'Campaign Updates', description: 'Updates on campaign performance and status changes' },
                { key: 'seoAlerts', label: 'SEO Alerts', description: 'Notifications about ranking changes and SEO issues' },
                { key: 'aiRecommendations', label: 'AI Recommendations', description: 'New AI-generated recommendations and insights' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key as keyof typeof notifications]}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, [item.key]: checked })
                    }
                  />
                </div>
              ))}

              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Save Preferences
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
              <CardDescription>Manage API keys for this brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Event Tracking API Key</p>
                      <p className="text-sm text-muted-foreground">Use this key in your tracking SDK</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Key className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      value="sg_live_abc123xyz789..."
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm">
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Webhook Secret</p>
                      <p className="text-sm text-muted-foreground">Verify incoming webhook requests</p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Key className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Input
                      value="whsec_abc123xyz789..."
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="sm">
                      Copy
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Security Note</p>
                    <p className="text-sm text-muted-foreground">
                      Keep your API keys secure. Never expose them in client-side code or public repositories.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Settings */}
        <TabsContent value="team">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage who has access to this brand</CardDescription>
                </div>
                <Button>
                  <Users className="mr-2 h-4 w-4" />
                  Invite Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { name: 'John Smith', email: 'john@example.com', role: 'Owner', avatar: 'JS' },
                  { name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Admin', avatar: 'SJ' },
                  { name: 'Mike Wilson', email: 'mike@example.com', role: 'Editor', avatar: 'MW' },
                ].map((member, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">{member.role}</span>
                      {member.role !== 'Owner' && (
                        <Button variant="ghost" size="sm">
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
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
                  <p className="font-medium">Archive Brand</p>
                  <p className="text-sm text-muted-foreground">
                    Hide this brand from your dashboard. You can restore it later.
                  </p>
                </div>
                <Button variant="outline">
                  Archive
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
                <div>
                  <p className="font-medium text-destructive">Delete Brand</p>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete this brand and all its data. This cannot be undone.
                  </p>
                </div>
                <Button variant="destructive">
                  Delete Brand
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
