'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Target,
  Search,
  Share2,
  Mail,
  MousePointer,
  Globe,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const channels = [
  { name: 'Google Ads', leads: 892, conversions: 156, revenue: 23400, cost: 4500, icon: Search, color: '#4285f4' },
  { name: 'Meta Ads', leads: 567, conversions: 89, revenue: 13350, cost: 2800, icon: Share2, color: '#1877f2' },
  { name: 'Organic Search', leads: 423, conversions: 78, revenue: 11700, cost: 0, icon: Globe, color: '#22c55e' },
  { name: 'Email', leads: 312, conversions: 67, revenue: 10050, cost: 150, icon: Mail, color: '#ea4335' },
  { name: 'Direct', leads: 234, conversions: 45, revenue: 6750, cost: 0, icon: MousePointer, color: '#6b7280' },
  { name: 'LinkedIn Ads', leads: 189, conversions: 34, revenue: 5100, cost: 1200, icon: Share2, color: '#0077b5' },
]

const touchpoints = [
  { journey: 'Google Ads → Blog → Pricing → Trial', conversions: 89, avgDays: 4 },
  { journey: 'Organic → Home → Features → Demo', conversions: 67, avgDays: 7 },
  { journey: 'Email → Landing → Pricing → Trial', conversions: 45, avgDays: 2 },
  { journey: 'Meta Ads → Landing → Trial', conversions: 34, avgDays: 1 },
  { journey: 'LinkedIn → Blog → Webinar → Demo', conversions: 28, avgDays: 14 },
]

export default function AttributionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Target className="h-8 w-8 text-purple-500" />
            Attribution
          </h1>
          <p className="text-muted-foreground">
            Understand which channels drive conversions
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="mr-2 h-4 w-4" />
          Last 30 Days
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">2,617</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">469</p>
                <p className="text-sm text-muted-foreground">Conversions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">$70,350</p>
                <p className="text-sm text-muted-foreground">Attributed Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-100">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">8.1x</p>
                <p className="text-sm text-muted-foreground">Avg ROAS</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Channel Performance</CardTitle>
          <CardDescription>Attribution by marketing channel (last-touch)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {channels.map((channel) => {
              const roas = channel.cost > 0 ? (channel.revenue / channel.cost).toFixed(1) : '∞'
              const convRate = ((channel.conversions / channel.leads) * 100).toFixed(1)
              return (
                <div key={channel.name} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${channel.color}20` }}>
                    <channel.icon className="h-5 w-5" style={{ color: channel.color }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{channel.name}</p>
                    <p className="text-xs text-muted-foreground">{channel.leads} leads → {channel.conversions} conversions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${channel.revenue.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">
                      {convRate}% conv • {roas}x ROAS
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Common Paths */}
      <Card>
        <CardHeader>
          <CardTitle>Common Conversion Paths</CardTitle>
          <CardDescription>Most frequent touchpoint journeys</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {touchpoints.map((path, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium">{path.journey}</p>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="font-semibold">{path.conversions}</p>
                    <p className="text-xs text-muted-foreground">conversions</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{path.avgDays} days</p>
                    <p className="text-xs text-muted-foreground">avg time</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
