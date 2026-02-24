'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Calendar,
  Download,
  Plus,
  Loader2,
  ArrowRight,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
}

export default function CallsPage() {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Phone className="h-8 w-8 text-green-500" />
            Call Analytics
          </h1>
          <p className="text-muted-foreground">
            Track and attribute calls to marketing campaigns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-green-500/10 p-4 mb-4">
              <Phone className="h-8 w-8 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand and connect your phone system to track and attribute calls to marketing campaigns.
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
          {/* Setup Banner */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-900 dark:text-amber-300">Call Tracking Setup Required</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Connect your Telnyx account (StewardRing) to start tracking calls and attributing them to marketing campaigns.
                </p>
                <a href="/settings" className="inline-flex items-center gap-1 text-sm text-amber-800 dark:text-amber-300 font-medium mt-2 hover:underline">
                  Configure in Settings <ArrowRight className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Stats - Empty */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Total Calls</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <PhoneIncoming className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Inbound</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <PhoneOutgoing className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Outbound</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <PhoneMissed className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-2xl font-bold">0</p>
                <p className="text-sm text-muted-foreground">Missed</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Calls - Empty */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Recent Calls</CardTitle>
                <CardDescription>Latest call activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No calls recorded yet</p>
                  <p className="text-sm mt-1">Connect your phone system to start tracking calls</p>
                </div>
              </CardContent>
            </Card>

            {/* Attribution - Empty */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Call Attribution</CardTitle>
                <CardDescription>Which marketing channels drive calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No attribution data yet</p>
                  <p className="text-sm mt-1">Call attribution will appear as calls are tracked</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
