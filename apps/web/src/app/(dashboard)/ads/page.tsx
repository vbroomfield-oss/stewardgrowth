'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard, MetricGrid } from '@/components/charts/metric-card'
import {
  Target,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  Plus,
  Settings,
  ExternalLink,
  BarChart3,
  Zap,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock campaign data
const mockCampaigns = [
  {
    id: '1',
    name: 'Church Software - Search',
    platform: 'google',
    status: 'active',
    budget: 50,
    spend: 1234,
    impressions: 45678,
    clicks: 1523,
    conversions: 42,
    ctr: 3.33,
    cpc: 0.81,
    cpa: 29.38,
    roas: 3.2,
    trend: 'up',
  },
  {
    id: '2',
    name: 'Ministry Leaders - Retargeting',
    platform: 'meta',
    status: 'active',
    budget: 30,
    spend: 876,
    impressions: 123456,
    clicks: 2345,
    conversions: 28,
    ctr: 1.90,
    cpc: 0.37,
    cpa: 31.29,
    roas: 2.8,
    trend: 'up',
  },
  {
    id: '3',
    name: 'Church Admin Demo',
    platform: 'linkedin',
    status: 'active',
    budget: 25,
    spend: 543,
    impressions: 12345,
    clicks: 234,
    conversions: 8,
    ctr: 1.90,
    cpc: 2.32,
    cpa: 67.88,
    roas: 1.4,
    trend: 'down',
  },
  {
    id: '4',
    name: 'VoIP for Churches',
    platform: 'google',
    status: 'paused',
    budget: 40,
    spend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    cpa: 0,
    roas: 0,
    trend: 'neutral',
  },
]

const mockRecommendations = [
  {
    id: '1',
    type: 'scale',
    campaign: 'Church Software - Search',
    message: 'Strong performance (3.2x ROAS). Consider increasing budget by 20%.',
    impact: 'high',
    action: 'Increase Budget',
  },
  {
    id: '2',
    type: 'optimize',
    campaign: 'Church Admin Demo',
    message: 'CPA above target ($67.88 vs $50). Review audience targeting.',
    impact: 'medium',
    action: 'Review Targeting',
  },
  {
    id: '3',
    type: 'creative',
    campaign: 'Ministry Leaders - Retargeting',
    message: 'Ad fatigue detected. CTR dropped 15% in 7 days. Refresh creatives.',
    impact: 'medium',
    action: 'Update Creatives',
  },
  {
    id: '4',
    type: 'new',
    campaign: null,
    message: 'Opportunity: "church check-in software" has low competition. Launch search campaign.',
    impact: 'high',
    action: 'Create Campaign',
  },
]

const platformConfig: Record<string, { name: string; color: string; bgColor: string }> = {
  google: { name: 'Google Ads', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  meta: { name: 'Meta Ads', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  linkedin: { name: 'LinkedIn Ads', color: 'text-sky-600', bgColor: 'bg-sky-100 dark:bg-sky-900/30' },
  tiktok: { name: 'TikTok Ads', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
}

export default function AdsPage() {
  const [selectedBrand, setSelectedBrand] = useState('stewardmax')
  const [dateRange, setDateRange] = useState('30d')

  const totalSpend = mockCampaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalConversions = mockCampaigns.reduce((sum, c) => sum + c.conversions, 0)
  const avgROAS = mockCampaigns.filter(c => c.roas > 0).reduce((sum, c) => sum + c.roas, 0) / mockCampaigns.filter(c => c.roas > 0).length
  const avgCPA = totalSpend / totalConversions

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
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="stewardmax">StewardMAX</option>
            <option value="stewardring">StewardRing</option>
          </select>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <Button asChild>
            <Link href="/ads/create">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Metrics */}
      <MetricGrid columns={5}>
        <MetricCard
          title="Total Spend"
          value={totalSpend}
          format="currency"
          change={12.5}
        />
        <MetricCard
          title="Conversions"
          value={totalConversions}
          change={18.3}
        />
        <MetricCard
          title="Avg. ROAS"
          value={avgROAS}
          format="decimal"
          change={8.2}
        />
        <MetricCard
          title="Avg. CPA"
          value={avgCPA}
          format="currency"
          change={-5.4}
          trendIsPositive={false}
        />
        <MetricCard
          title="Active Campaigns"
          value={mockCampaigns.filter(c => c.status === 'active').length}
        />
      </MetricGrid>

      {/* AI Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            AI Recommendations
          </CardTitle>
          <CardDescription>
            Smart suggestions to improve your ad performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {mockRecommendations.map((rec) => (
              <div
                key={rec.id}
                className={cn(
                  'p-4 border rounded-lg',
                  rec.impact === 'high' ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-yellow-500'
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {rec.campaign && (
                      <p className="text-xs text-muted-foreground mb-1">{rec.campaign}</p>
                    )}
                    <p className="text-sm">{rec.message}</p>
                  </div>
                  <Button size="sm" variant="outline">
                    {rec.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
              <TabsTrigger value="meta">Meta</TabsTrigger>
              <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-sm">Campaign</th>
                      <th className="pb-3 font-medium text-sm">Status</th>
                      <th className="pb-3 font-medium text-sm text-right">Spend</th>
                      <th className="pb-3 font-medium text-sm text-right">Impressions</th>
                      <th className="pb-3 font-medium text-sm text-right">Clicks</th>
                      <th className="pb-3 font-medium text-sm text-right">Conv.</th>
                      <th className="pb-3 font-medium text-sm text-right">CTR</th>
                      <th className="pb-3 font-medium text-sm text-right">CPA</th>
                      <th className="pb-3 font-medium text-sm text-right">ROAS</th>
                      <th className="pb-3 font-medium text-sm"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCampaigns.map((campaign) => {
                      const platform = platformConfig[campaign.platform]
                      return (
                        <tr key={campaign.id} className="border-b last:border-0">
                          <td className="py-4">
                            <div>
                              <p className="font-medium">{campaign.name}</p>
                              <span className={cn(
                                'text-xs px-2 py-0.5 rounded-full',
                                platform.bgColor,
                                platform.color
                              )}>
                                {platform.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              'flex items-center gap-1 text-sm',
                              campaign.status === 'active' ? 'text-green-600' : 'text-gray-500'
                            )}>
                              {campaign.status === 'active' ? (
                                <Play className="h-3 w-3" />
                              ) : (
                                <Pause className="h-3 w-3" />
                              )}
                              {campaign.status}
                            </span>
                          </td>
                          <td className="py-4 text-right">${campaign.spend.toLocaleString()}</td>
                          <td className="py-4 text-right">{campaign.impressions.toLocaleString()}</td>
                          <td className="py-4 text-right">{campaign.clicks.toLocaleString()}</td>
                          <td className="py-4 text-right">{campaign.conversions}</td>
                          <td className="py-4 text-right">{campaign.ctr.toFixed(2)}%</td>
                          <td className="py-4 text-right">
                            ${campaign.cpa > 0 ? campaign.cpa.toFixed(2) : '-'}
                          </td>
                          <td className="py-4 text-right">
                            <span className={cn(
                              'font-medium',
                              campaign.roas >= 2 ? 'text-green-600' :
                              campaign.roas >= 1 ? 'text-yellow-600' :
                              campaign.roas > 0 ? 'text-red-600' : 'text-gray-400'
                            )}>
                              {campaign.roas > 0 ? `${campaign.roas.toFixed(1)}x` : '-'}
                            </span>
                          </td>
                          <td className="py-4">
                            <div className="flex items-center gap-1 justify-end">
                              <Button variant="ghost" size="icon">
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Settings className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Platform Connections */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Platforms</CardTitle>
          <CardDescription>Manage your ad platform integrations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {Object.entries(platformConfig).map(([key, platform]) => (
              <div key={key} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className={cn('font-medium', platform.color)}>{platform.name}</span>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
                <p className="text-xs text-muted-foreground">Connected</p>
                <Button variant="ghost" size="sm" className="mt-2 w-full">
                  <Settings className="h-3 w-3 mr-1" />
                  Manage
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
