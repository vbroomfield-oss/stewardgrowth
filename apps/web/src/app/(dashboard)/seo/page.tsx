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
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
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
        <div className="flex items-center gap-2">
          <Button variant="outline" disabled>
            <RefreshCw className="mr-2 h-4 w-4" />
            Run Audit
          </Button>
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-blue-500/10 p-4 mb-4">
              <Search className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">SEO Tracking Coming Soon</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              SEO monitoring, keyword rankings, and technical audits will be available soon.
              Your brands are configured and ready to track.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {brands.length} brand{brands.length !== 1 ? 's' : ''} ready
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/ai">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Search className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">AI Recommendations</p>
                <p className="text-sm text-gray-500">Get AI-powered insights</p>
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
