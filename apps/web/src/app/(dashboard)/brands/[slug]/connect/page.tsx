'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  Code,
  Zap,
  Globe,
  Smartphone,
  Server,
  ExternalLink,
  Play,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// This would come from API
const mockBrand = {
  name: 'StewardPro',
  slug: 'stewardpro',
  trackingId: 'SG-X7K9M2',
  apiKey: 'sg_live_a1b2c3d4e5f6g7h8i9j0',
  domains: ['stewardpro.app', 'app.stewardpro.app'],
}

export default function ConnectPage({ params }: { params: { slug: string } }) {
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [copiedApi, setCopiedApi] = useState(false)
  const [testEventSent, setTestEventSent] = useState(false)

  const trackingSnippet = `<!-- StewardGrowth Tracking -->
<script async src="https://cdn.stewardgrowth.com/sdk/sg.js?id=${mockBrand.trackingId}"></script>`

  const copyToClipboard = (text: string, type: 'snippet' | 'api') => {
    navigator.clipboard.writeText(text)
    if (type === 'snippet') {
      setCopiedSnippet(true)
      setTimeout(() => setCopiedSnippet(false), 2000)
    } else {
      setCopiedApi(true)
      setTimeout(() => setCopiedApi(false), 2000)
    }
  }

  const sendTestEvent = () => {
    setTestEventSent(true)
    // In production: actually send test event
    setTimeout(() => setTestEventSent(false), 3000)
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/brands/${params.slug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connect {mockBrand.name}</h1>
          <p className="text-muted-foreground">
            Add tracking to start collecting marketing data
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium">Tracking ID</p>
              <p className="text-sm font-mono text-green-600">{mockBrand.trackingId}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Domains</p>
              <p className="text-sm text-muted-foreground">{mockBrand.domains.length} configured</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Status</p>
              <p className="text-sm text-yellow-600">Waiting for first event</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="snippet">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="snippet">
            <Code className="mr-2 h-4 w-4" />
            Website Snippet
          </TabsTrigger>
          <TabsTrigger value="api">
            <Server className="mr-2 h-4 w-4" />
            Server API
          </TabsTrigger>
          <TabsTrigger value="mobile">
            <Smartphone className="mr-2 h-4 w-4" />
            Mobile SDK
          </TabsTrigger>
        </TabsList>

        {/* Website Snippet - Simplest Option */}
        <TabsContent value="snippet" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">1</span>
                Copy the Tracking Snippet
              </CardTitle>
              <CardDescription>
                Just one line of code - works with any website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-sm overflow-x-auto">
                  {trackingSnippet}
                </pre>
                <Button
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(trackingSnippet, 'snippet')}
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="mr-1 h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1 h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">2</span>
                Paste in Your Website
              </CardTitle>
              <CardDescription>
                Add it to the &lt;head&gt; section of your HTML
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Next.js / React</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Add to your layout.tsx or _app.tsx
                  </p>
                  <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`// app/layout.tsx
<head>
  <script async src="..."/>
</head>`}
                  </pre>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">WordPress</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to Appearance → Theme Editor → header.php
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Or use a plugin like &quot;Insert Headers and Footers&quot;
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Shopify</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Online Store → Themes → Edit Code → theme.liquid
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Any HTML Site</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Paste before the closing &lt;/head&gt; tag
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                That&apos;s It! 🎉
              </CardTitle>
              <CardDescription>
                Events will start flowing automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Auto-tracked events:</h4>
                <ul className="text-sm text-green-600 dark:text-green-300 space-y-1">
                  <li>✓ Page views with full attribution (UTM, referrer)</li>
                  <li>✓ Session start/end with duration</li>
                  <li>✓ Device and browser info</li>
                  <li>✓ User identification (when they log in)</li>
                </ul>
              </div>

              <div className="mt-4">
                <h4 className="font-medium mb-2">Optional: Track Custom Events</h4>
                <pre className="p-3 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`// Track a signup
sg.track('signup_completed', { plan: 'trial' });

// Identify a user when they log in
sg.identify('user_123', { email: 'user@example.com' });

// Track a purchase
sg.track('subscription_started', {
  plan: 'pro',
  revenue: 99,
  currency: 'USD'
});`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Server API */}
        <TabsContent value="api" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Server-Side API</CardTitle>
              <CardDescription>
                For backend tracking (webhooks, server events)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">API Key</label>
                <div className="flex gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm">
                    {mockBrand.apiKey}
                  </code>
                  <Button
                    variant="outline"
                    onClick={() => copyToClipboard(mockBrand.apiKey, 'api')}
                  >
                    {copiedApi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Send Events via API</h4>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`curl -X POST https://api.stewardgrowth.com/events/ingest \\
  -H "Authorization: Bearer ${mockBrand.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event_name": "subscription_started",
    "user_id": "user_123",
    "properties": {
      "plan": "pro",
      "revenue": 99
    }
  }'`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mobile SDK */}
        <TabsContent value="mobile" className="space-y-6 mt-6">
          <Card>
            <CardContent className="py-12 text-center">
              <Smartphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Mobile SDKs Coming Soon</h3>
              <p className="text-muted-foreground mb-4">
                iOS and Android SDKs are in development
              </p>
              <p className="text-sm text-muted-foreground">
                For now, use the Server API to track mobile events
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Test Connection */}
      <Card>
        <CardHeader>
          <CardTitle>Test Your Connection</CardTitle>
          <CardDescription>
            Verify that events are being received
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={sendTestEvent} disabled={testEventSent}>
              {testEventSent ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  Event Sent!
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Send Test Event
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground">
              After installing the snippet, click to verify events are being received
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
