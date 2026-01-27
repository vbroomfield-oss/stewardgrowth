'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
  Play,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface Brand {
  name: string
  slug: string
  trackingId: string | null
  apiKey: string | null
  domain: string | null
  counts: {
    events: number
  }
}

export default function ConnectPage() {
  const params = useParams()
  const slug = params.slug as string

  const [brand, setBrand] = useState<Brand | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedSnippet, setCopiedSnippet] = useState(false)
  const [copiedApi, setCopiedApi] = useState(false)
  const [testEventSent, setTestEventSent] = useState(false)
  const [testEventLoading, setTestEventLoading] = useState(false)

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

      setBrand(result.data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

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

  const sendTestEvent = async () => {
    if (!brand?.trackingId || !brand?.apiKey) return

    setTestEventLoading(true)
    try {
      const response = await fetch('/api/events/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': brand.apiKey,
        },
        body: JSON.stringify({
          brandId: brand.trackingId,
          eventType: 'page_view',
          timestamp: new Date().toISOString(),
          visitorId: 'test_visitor',
          sessionId: 'test_session',
          url: window.location.href,
          properties: { source: 'test_event' },
        }),
      })

      const result = await response.json()
      if (result.success) {
        setTestEventSent(true)
        setTimeout(() => setTestEventSent(false), 3000)
      } else {
        alert('Failed to send test event: ' + result.error)
      }
    } catch (err) {
      alert('Failed to send test event')
    } finally {
      setTestEventLoading(false)
    }
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

  // Generate tracking snippet with the real API endpoint
  const apiEndpoint = typeof window !== 'undefined' ? window.location.origin : ''
  const trackingSnippet = `<!-- StewardGrowth Tracking for ${brand.name} -->
<script>
(function() {
  var SG_TRACKING_ID = '${brand.trackingId}';
  var SG_API_KEY = '${brand.apiKey}';
  var SG_ENDPOINT = '${apiEndpoint}/api/events/ingest';

  // Get UTM parameters from URL
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content')
    };
  }

  // Get or create visitor ID
  function getVisitorId() {
    var vid = localStorage.getItem('sg_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('sg_visitor_id', vid);
    }
    return vid;
  }

  // Get or create session ID
  function getSessionId() {
    var sid = sessionStorage.getItem('sg_session_id');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('sg_session_id', sid);
    }
    return sid;
  }

  // Send event to StewardGrowth
  window.sgTrack = function(eventName, properties) {
    var utm = getUtmParams();
    var data = {
      brandId: SG_TRACKING_ID,
      eventType: eventName,
      timestamp: new Date().toISOString(),
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      url: window.location.href,
      referrer: document.referrer,
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign,
      utmTerm: utm.utm_term,
      utmContent: utm.utm_content,
      properties: properties || {}
    };

    fetch(SG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SG_API_KEY
      },
      body: JSON.stringify(data)
    }).catch(function() {});
  };

  // Identify user
  window.sgIdentify = function(userId, traits) {
    localStorage.setItem('sg_user_id', userId);
    sgTrack('identify', { userId: userId, ...traits });
  };

  // Auto-track page view
  sgTrack('page_view', { title: document.title });
})();
</script>`

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/brands/${slug}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Connect {brand.name}</h1>
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
              <p className="text-sm font-mono text-green-600">{brand.trackingId || 'Not set'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Globe className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium">Domain</p>
              <p className="text-sm text-muted-foreground">{brand.domain || 'Not configured'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Zap className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium">Events Received</p>
              <p className={`text-sm ${brand.counts.events > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                {brand.counts.events > 0 ? `${brand.counts.events.toLocaleString()} events` : 'Waiting for first event'}
              </p>
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
                Copy this code and paste it into your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-64">
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
                    Add to your layout.tsx or _app.tsx inside the &lt;head&gt; tag
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">WordPress</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Go to Appearance → Theme Editor → header.php, or use a plugin like &quot;Insert Headers and Footers&quot;
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Shopify</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Online Store → Themes → Edit Code → theme.liquid, paste before &lt;/head&gt;
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Any HTML Site</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Paste before the closing &lt;/head&gt; tag on every page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">3</span>
                Track Custom Events (Optional)
              </CardTitle>
              <CardDescription>
                Use these functions to track signups, purchases, and more
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`// Track a signup
sgTrack('signup_completed', { plan: 'trial' });

// Identify a user when they log in
sgIdentify('user_123', { email: 'user@example.com', name: 'John Doe' });

// Track a purchase
sgTrack('subscription_started', { plan: 'pro', revenue: 99, currency: 'USD' });

// Track form submission
sgTrack('lead_captured', { source: 'contact_form' });`}
              </pre>
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
                  <code className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {brand.apiKey || 'Not set'}
                  </code>
                  {brand.apiKey && (
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(brand.apiKey!, 'api')}
                    >
                      {copiedApi ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Send Events via API</h4>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`curl -X POST ${apiEndpoint}/api/events/ingest \\
  -H "x-api-key: ${brand.apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "brandId": "${brand.trackingId}",
    "eventType": "subscription_started",
    "timestamp": "2024-01-15T10:30:00Z",
    "properties": {
      "userId": "user_123",
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
                For now, use the Server API to track mobile app events
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
            <Button
              onClick={sendTestEvent}
              disabled={testEventSent || testEventLoading || !brand.trackingId}
            >
              {testEventLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : testEventSent ? (
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
              Click to send a test event and verify your setup is working
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
