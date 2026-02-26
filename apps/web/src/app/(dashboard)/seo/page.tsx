'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Search,
  Globe,
  TrendingUp,
  Link2,
  BarChart3,
  FileText,
  CheckCircle2,
  Bell,
} from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const features = [
  {
    icon: Globe,
    title: 'Technical SEO Audits',
    description: 'Crawl your sites to identify broken links, missing meta tags, and performance issues',
    color: 'blue',
  },
  {
    icon: Search,
    title: 'Keyword Tracking',
    description: 'Monitor your rankings across target keywords and discover new opportunities',
    color: 'green',
  },
  {
    icon: TrendingUp,
    title: 'Rank Monitoring',
    description: 'Track position changes daily across Google Search for all your brands',
    color: 'purple',
  },
  {
    icon: Link2,
    title: 'Backlink Analysis',
    description: 'Monitor your backlink profile and find new link-building opportunities',
    color: 'orange',
  },
  {
    icon: BarChart3,
    title: 'Google Search Console Integration',
    description: 'Pull real impressions, clicks, and CTR data directly from GSC',
    color: 'teal',
  },
  {
    icon: FileText,
    title: 'AI Content Recommendations',
    description: 'Get AI-powered suggestions for content that will rank for your target keywords',
    color: 'pink',
  },
]

export default function SEOPage() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleNotify = () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Enter a valid email', variant: 'destructive' })
      return
    }
    setSubscribed(true)
    toast({ title: 'Subscribed', description: 'We\'ll notify you when SEO features launch.' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Search className="h-8 w-8 text-green-500" />
          SEO Automation
        </h1>
        <p className="text-muted-foreground">
          Technical audits, keyword tracking, and ranking intelligence
        </p>
      </div>

      {/* Coming Soon Banner */}
      <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 dark:border-green-800">
        <CardContent className="py-12 flex flex-col items-center text-center">
          <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-4">
            <Search className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">SEO Features Coming Soon</h2>
          <p className="text-muted-foreground max-w-lg mb-6">
            We&apos;re building a comprehensive SEO suite that connects directly to Google Search Console,
            tracks your rankings daily, and uses AI to recommend content improvements.
          </p>

          {subscribed ? (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">You&apos;ll be notified when we launch!</span>
            </div>
          ) : (
            <div className="flex gap-2 w-full max-w-sm">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNotify()}
              />
              <Button onClick={handleNotify}>
                <Bell className="mr-2 h-4 w-4" />
                Notify Me
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div>
        <h3 className="text-lg font-semibold mb-4">What&apos;s Coming</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="opacity-75">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-muted rounded-lg">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">{feature.title}</p>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
