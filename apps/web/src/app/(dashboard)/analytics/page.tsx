'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MetricCard, MetricGrid } from '@/components/charts/metric-card'
import { FunnelChart } from '@/components/charts/funnel-chart'
import { AttributionChart } from '@/components/charts/attribution-chart'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  Calendar,
  Download,
  Filter,
} from 'lucide-react'
import { type ChannelAttribution } from '@/lib/analytics/attribution'

// Mock data for the analytics dashboard
const mockKPIs = {
  pageViews: 45678,
  uniqueVisitors: 12453,
  sessions: 18234,
  leads: 342,
  qualifiedLeads: 89,
  trials: 156,
  conversions: 47,
  revenue: 23450,
  adSpend: 8500,
  roas: 2.76,
  ctr: 3.2,
  cpa: 180.85,
}

const mockTrends = {
  pageViews: [32000, 35000, 38000, 42000, 40000, 44000, 45678],
  leads: [280, 290, 310, 320, 335, 340, 342],
  revenue: [18000, 19500, 20000, 21500, 22000, 22800, 23450],
}

const mockFunnelData = [
  { name: 'Page Views', value: 45678 },
  { name: 'Engaged Visitors', value: 12453 },
  { name: 'Leads Captured', value: 342 },
  { name: 'Qualified Leads', value: 89 },
  { name: 'Trial Started', value: 156 },
  { name: 'Converted', value: 47 },
]

const mockAttributionData: ChannelAttribution[] = [
  {
    channel: 'paid_search',
    firstTouch: 12.5,
    lastTouch: 18.2,
    linear: 14.8,
    timeDecay: 16.1,
    positionBased: 15.4,
    conversions: 18,
    revenue: 8920,
    avgTouchpoints: 3.2,
    avgTimeToConversion: 7.5,
  },
  {
    channel: 'paid_social',
    firstTouch: 15.3,
    lastTouch: 8.7,
    linear: 11.2,
    timeDecay: 9.8,
    positionBased: 11.9,
    conversions: 12,
    revenue: 5840,
    avgTouchpoints: 2.8,
    avgTimeToConversion: 12.3,
  },
  {
    channel: 'organic_search',
    firstTouch: 8.1,
    lastTouch: 11.4,
    linear: 9.5,
    timeDecay: 10.2,
    positionBased: 9.7,
    conversions: 10,
    revenue: 4750,
    avgTouchpoints: 4.1,
    avgTimeToConversion: 21.5,
  },
  {
    channel: 'direct',
    firstTouch: 5.2,
    lastTouch: 6.8,
    linear: 6.1,
    timeDecay: 6.5,
    positionBased: 6.0,
    conversions: 6,
    revenue: 2890,
    avgTouchpoints: 2.1,
    avgTimeToConversion: 5.2,
  },
  {
    channel: 'email',
    firstTouch: 2.8,
    lastTouch: 4.5,
    linear: 3.8,
    timeDecay: 4.1,
    positionBased: 3.6,
    conversions: 4,
    revenue: 1980,
    avgTouchpoints: 5.4,
    avgTimeToConversion: 14.8,
  },
]

const mockConversionPaths = [
  { path: ['paid_search', 'direct', 'organic_search'], count: 12, pct: 25.5 },
  { path: ['paid_social', 'email', 'direct'], count: 8, pct: 17.0 },
  { path: ['organic_search', 'paid_search'], count: 7, pct: 14.9 },
  { path: ['paid_search'], count: 6, pct: 12.8 },
  { path: ['paid_social', 'paid_search', 'direct'], count: 5, pct: 10.6 },
]

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30d')
  const [selectedBrand, setSelectedBrand] = useState('all')

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
            <option value="stewardmax">StewardMAX</option>
            <option value="stewardring">StewardRing</option>
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
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Overview */}
      <MetricGrid columns={5}>
        <MetricCard
          title="Page Views"
          value={mockKPIs.pageViews}
          change={12.5}
          sparklineData={mockTrends.pageViews}
        />
        <MetricCard
          title="Unique Visitors"
          value={mockKPIs.uniqueVisitors}
          change={8.3}
        />
        <MetricCard
          title="Leads"
          value={mockKPIs.leads}
          change={15.2}
          sparklineData={mockTrends.leads}
        />
        <MetricCard
          title="Revenue"
          value={mockKPIs.revenue}
          format="currency"
          change={22.1}
          sparklineData={mockTrends.revenue}
        />
        <MetricCard
          title="ROAS"
          value={mockKPIs.roas}
          format="decimal"
          change={5.8}
          changeLabel="vs target"
        />
      </MetricGrid>

      {/* Secondary Metrics */}
      <MetricGrid columns={4}>
        <MetricCard
          title="Cost Per Acquisition"
          value={mockKPIs.cpa}
          format="currency"
          change={-8.5}
          trendIsPositive={false}
        />
        <MetricCard
          title="Click-Through Rate"
          value={mockKPIs.ctr}
          format="percent"
          change={3.2}
        />
        <MetricCard
          title="Ad Spend"
          value={mockKPIs.adSpend}
          format="currency"
          change={10.0}
        />
        <MetricCard
          title="Trial Conversion"
          value={(mockKPIs.conversions / mockKPIs.trials) * 100}
          format="percent"
          change={4.7}
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
          <FunnelChart data={mockFunnelData} showConversionRates />
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
          <AttributionChart data={mockAttributionData} />
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
          <div className="space-y-3">
            {mockConversionPaths.map((path, index) => (
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
