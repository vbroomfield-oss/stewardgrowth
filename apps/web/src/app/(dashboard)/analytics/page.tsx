'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MetricCard, MetricGrid } from '@/components/charts/metric-card'
import { FunnelChart } from '@/components/charts/funnel-chart'
import { AttributionChart } from '@/components/charts/attribution-chart'
import {
  BarChart3,
  TrendingUp,
  Target,
  ArrowUpRight,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { type ChannelAttribution } from '@/lib/analytics/attribution'

interface Brand {
  id: string
  name: string
  slug: string
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedBrand, setSelectedBrand] = useState('all')
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

  // Empty state KPIs - will be populated from real event data
  const kpis = {
    pageViews: 0,
    uniqueVisitors: 0,
    sessions: 0,
    leads: 0,
    qualifiedLeads: 0,
    trials: 0,
    conversions: 0,
    revenue: 0,
    adSpend: 0,
    roas: 0,
    ctr: 0,
    cpa: 0,
  }

  // Empty funnel data
  const funnelData = [
    { name: 'Page Views', value: 0 },
    { name: 'Engaged Visitors', value: 0 },
    { name: 'Leads Captured', value: 0 },
    { name: 'Qualified Leads', value: 0 },
    { name: 'Trial Started', value: 0 },
    { name: 'Converted', value: 0 },
  ]

  // Empty attribution data
  const attributionData: ChannelAttribution[] = []

  // Empty conversion paths
  const conversionPaths: { path: string[]; count: number; pct: number }[] = []

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
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Track performance, attribution, and conversion metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="all">All Brands</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.slug}>{brand.name}</option>
            ))}
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="12m">Last 12 months</option>
          </select>
          <Button variant="outline" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* No Data Notice */}
      {brands.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">No analytics data yet</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Analytics data will appear here once you install the tracking code on your brand domains and start receiving events.
                Visit your brand settings to get the tracking snippet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {brands.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-blue-500/10 p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start tracking analytics, attribution, and conversion metrics.
            </p>
            <Button asChild size="lg">
              <Link href="/brands/new">Add Your First Brand</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KPI Overview */}
      <MetricGrid columns={5}>
        <MetricCard
          title="Page Views"
          value={kpis.pageViews}
          change={0}
        />
        <MetricCard
          title="Unique Visitors"
          value={kpis.uniqueVisitors}
          change={0}
        />
        <MetricCard
          title="Leads"
          value={kpis.leads}
          change={0}
        />
        <MetricCard
          title="Revenue"
          value={kpis.revenue}
          format="currency"
          change={0}
        />
        <MetricCard
          title="ROAS"
          value={kpis.roas}
          format="decimal"
          change={0}
          changeLabel="vs target"
        />
      </MetricGrid>

      {/* Secondary Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          title="Cost Per Acquisition"
          value={kpis.cpa}
          format="currency"
          change={0}
          trendIsPositive={false}
        />
        <MetricCard
          title="Click-Through Rate"
          value={kpis.ctr}
          format="percent"
          change={0}
        />
        <MetricCard
          title="Ad Spend"
          value={kpis.adSpend}
          format="currency"
          change={0}
        />
        <MetricCard
          title="Trial Conversion"
          value={kpis.trials > 0 ? (kpis.conversions / kpis.trials) * 100 : 0}
          format="percent"
          change={0}
        />
      </MetricGrid>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Conversion Funnel
          </CardTitle>
          <CardDescription>
            Track visitors through your marketing funnel
          </CardDescription>
        </CardHeader>
        <CardContent>
          {funnelData.some(d => d.value > 0) ? (
            <FunnelChart data={funnelData} showConversionRates />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No funnel data yet</p>
              <p className="text-sm mt-1">Data will appear once events are tracked</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Attribution Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-purple-500" />
            Multi-Touch Attribution
          </CardTitle>
          <CardDescription>
            Understand how each channel contributes to conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {attributionData.length > 0 ? (
            <AttributionChart data={attributionData} />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No attribution data yet</p>
              <p className="text-sm mt-1">Connect your ad platforms and track conversions to see attribution</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Paths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Top Conversion Paths
          </CardTitle>
          <CardDescription>
            Most common channel sequences leading to conversions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {conversionPaths.length > 0 ? (
            <div className="space-y-3">
              {conversionPaths.map((path, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 w-6">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      {path.path.map((channel, idx) => (
                        <span key={idx} className="flex items-center">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded capitalize">
                            {channel.replace('_', ' ')}
                          </span>
                          {idx < path.path.length - 1 && (
                            <ArrowUpRight className="h-3 w-3 mx-1 text-gray-400" />
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">
                      {path.count} conversions
                    </span>
                    <span className="text-sm text-gray-500">
                      {path.pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No conversion paths yet</p>
              <p className="text-sm mt-1">Paths will appear as visitors convert through multiple channels</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/analytics/events">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Event Explorer</p>
                <p className="text-sm text-gray-500">Browse raw event data</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/attribution">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Attribution Models</p>
                <p className="text-sm text-gray-500">Compare attribution methods</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/reports">
          <Card className="hover:border-green-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Custom Reports</p>
                <p className="text-sm text-gray-500">Build and schedule reports</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
