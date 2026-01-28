'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Target,
  DollarSign,
  Plus,
  Loader2,
  Megaphone,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
}

export default function AdsPage() {
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
          <h1 className="text-3xl font-bold tracking-tight">Ad Campaigns</h1>
          <p className="text-muted-foreground">
            Manage and optimize your paid advertising across all platforms
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Megaphone className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start managing ad campaigns across Google, Meta, and LinkedIn.
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
          {/* Overview Metrics - Empty */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">$0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Conversions</p>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg. ROAS</p>
                <p className="text-2xl font-bold">-</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Avg. CPA</p>
                <p className="text-2xl font-bold">-</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">Active Campaigns</p>
                <p className="text-2xl font-bold">0</p>
              </CardContent>
            </Card>
          </div>

          {/* Campaigns Table - Empty State */}
          <Card>
            <CardHeader>
              <CardTitle>Campaigns</CardTitle>
              <CardDescription>Your ad campaigns across all platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No campaigns yet</p>
                <p className="text-sm mt-1">Connect your ad platforms to start managing campaigns</p>
              </div>
            </CardContent>
          </Card>

          {/* Platform Connections */}
          <Card>
            <CardHeader>
              <CardTitle>Connect Ad Platforms</CardTitle>
              <CardDescription>Link your advertising accounts to manage campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-blue-600">Google Ads</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Not connected</p>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Connect
                  </Button>
                </div>
                <div className="p-4 border rounded-lg border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-indigo-600">Meta Ads</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Not connected</p>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Connect
                  </Button>
                </div>
                <div className="p-4 border rounded-lg border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sky-600">LinkedIn Ads</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Not connected</p>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Connect
                  </Button>
                </div>
                <div className="p-4 border rounded-lg border-dashed">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-pink-600">TikTok Ads</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">Not connected</p>
                  <Button variant="outline" size="sm" className="w-full" disabled>
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
