'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Search,
  Globe,
  FileText,
  RefreshCw,
  Plus,
  Loader2,
  Settings,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Link2,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  domain: string | null
}

export default function SEOPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          setBrands(data.brands || [])
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor rankings, fix issues, and discover opportunities
          </p>
        </div>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Search className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start tracking SEO performance, keyword rankings, and technical issues.
            </p>
            <Button asChild size="lg">
              <Link href="/brands/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Brand
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Setup Required Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-300">SEO Integration Setup Required</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  To enable SEO monitoring, connect one of these services in Settings:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-400 mt-2 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Google Search Console — for ranking and indexing data
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Ahrefs or SEMrush — for keyword research and backlink analysis
                  </li>
                </ul>
                <Button variant="outline" size="sm" className="mt-3" asChild>
                  <Link href="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Configure in Settings
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Brand Domains */}
          <Card>
            <CardHeader>
              <CardTitle>Your Brand Domains</CardTitle>
              <CardDescription>Domains that will be tracked once SEO tools are connected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {brands.map((brand) => (
                  <div key={brand.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{brand.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {brand.domain || 'No domain set'}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Awaiting connection
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SEO Features Preview */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-3 text-green-500 opacity-50" />
                <p className="font-medium">Keyword Rankings</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Track your positions for target keywords across search engines
                </p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <Link2 className="h-8 w-8 mx-auto mb-3 text-blue-500 opacity-50" />
                <p className="font-medium">Backlink Analysis</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Monitor your backlink profile and discover new opportunities
                </p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="p-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-3 text-orange-500 opacity-50" />
                <p className="font-medium">Technical Audit</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Find and fix technical SEO issues affecting your rankings
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/ai">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Search className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">AI Recommendations</p>
                <p className="text-sm text-gray-500">Get AI-powered SEO insights</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/events">
          <Card className="hover:border-green-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Globe className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Event Analytics</p>
                <p className="text-sm text-gray-500">View traffic sources</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Content Hub</p>
                <p className="text-sm text-gray-500">Create SEO content</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
