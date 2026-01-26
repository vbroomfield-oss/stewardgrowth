'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Zap,
  Search,
  Filter,
  Download,
  RefreshCw,
  MousePointer,
  Eye,
  UserPlus,
  CreditCard,
  ArrowRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const mockEvents = [
  { name: 'page_view', count: 45234, change: 12.5, icon: Eye },
  { name: 'button_click', count: 12456, change: 8.3, icon: MousePointer },
  { name: 'signup_started', count: 892, change: 15.7, icon: UserPlus },
  { name: 'signup_completed', count: 567, change: 22.1, icon: UserPlus },
  { name: 'trial_started', count: 234, change: 18.9, icon: Zap },
  { name: 'subscription_started', count: 89, change: 25.4, icon: CreditCard },
]

const recentEvents = [
  { event: 'subscription_started', user: 'user_8x7k2m', brand: 'StewardMAX', time: '2 min ago', properties: { plan: 'pro', revenue: 99 } },
  { event: 'signup_completed', user: 'user_9p3n1q', brand: 'StewardRing', time: '5 min ago', properties: { source: 'google_ads' } },
  { event: 'trial_started', user: 'user_2w5r8t', brand: 'StewardMAX', time: '8 min ago', properties: { plan: 'trial' } },
  { event: 'page_view', user: 'anon_k8m2p1', brand: 'StewardPro', time: '10 min ago', properties: { page: '/pricing' } },
  { event: 'button_click', user: 'user_6y4h9w', brand: 'StewardMAX', time: '12 min ago', properties: { button: 'start_trial' } },
]

export default function EventsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Zap className="h-8 w-8 text-yellow-500" />
            Event Tracking
          </h1>
          <p className="text-muted-foreground">
            Real-time event data from all your brands
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events..." className="pl-10" />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Event Summary */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {mockEvents.map((event) => (
          <Card key={event.name}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <event.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-green-500">+{event.change}%</span>
              </div>
              <p className="text-2xl font-bold">{event.count.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground font-mono">{event.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Live Event Stream */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                Live Event Stream
              </CardTitle>
              <CardDescription>Real-time events from your tracking SDK</CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'px-2 py-1 rounded text-xs font-mono',
                    event.event.includes('subscription') && 'bg-green-100 text-green-700',
                    event.event.includes('signup') && 'bg-blue-100 text-blue-700',
                    event.event.includes('trial') && 'bg-purple-100 text-purple-700',
                    event.event === 'page_view' && 'bg-gray-100 text-gray-700',
                    event.event === 'button_click' && 'bg-yellow-100 text-yellow-700',
                  )}>
                    {event.event}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{event.user}</p>
                    <p className="text-xs text-muted-foreground">{event.brand}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{event.time}</p>
                  <p className="text-xs font-mono text-muted-foreground">
                    {JSON.stringify(event.properties).slice(0, 30)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
