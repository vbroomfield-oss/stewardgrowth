'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  User,
  Building2,
  Search,
  Filter,
  Download,
  TrendingUp,
  Calendar,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const callStats = [
  { label: 'Total Calls', value: '1,247', change: 15.3, icon: Phone },
  { label: 'Inbound', value: '892', change: 12.1, icon: PhoneIncoming },
  { label: 'Outbound', value: '355', change: 22.4, icon: PhoneOutgoing },
  { label: 'Missed', value: '89', change: -8.5, icon: PhoneMissed },
]

const recentCalls = [
  { type: 'inbound', caller: '+1 (555) 123-4567', callerName: 'Pastor Mike Johnson', brand: 'StewardMAX', duration: '12:34', time: '10 min ago', outcome: 'Demo Scheduled' },
  { type: 'outbound', caller: '+1 (555) 987-6543', callerName: 'Sarah Williams', brand: 'StewardRing', duration: '5:21', time: '25 min ago', outcome: 'Follow-up Needed' },
  { type: 'inbound', caller: '+1 (555) 456-7890', callerName: 'First Baptist Church', brand: 'StewardMAX', duration: '8:45', time: '1 hour ago', outcome: 'Trial Started' },
  { type: 'missed', caller: '+1 (555) 321-0987', callerName: 'Unknown', brand: 'StewardRing', duration: '-', time: '2 hours ago', outcome: 'Callback Required' },
  { type: 'inbound', caller: '+1 (555) 654-3210', callerName: 'Grace Community', brand: 'StewardMAX', duration: '15:12', time: '3 hours ago', outcome: 'Subscription Started' },
]

const attributedCalls = [
  { source: 'Google Ads', calls: 345, conversions: 67, revenue: 10050 },
  { source: 'Meta Ads', calls: 234, conversions: 45, revenue: 6750 },
  { source: 'Organic Search', calls: 189, conversions: 38, revenue: 5700 },
  { source: 'Direct', calls: 124, conversions: 22, revenue: 3300 },
]

export default function CallsPage() {
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
            Track and attribute calls from StewardRing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {callStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
                <span className={cn(
                  'text-xs font-medium',
                  stat.change > 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {stat.change > 0 ? '+' : ''}{stat.change}%
                </span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Calls */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Calls</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCalls.map((call, i) => (
                <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={cn(
                    'p-2 rounded-lg',
                    call.type === 'inbound' && 'bg-green-100',
                    call.type === 'outbound' && 'bg-blue-100',
                    call.type === 'missed' && 'bg-red-100',
                  )}>
                    {call.type === 'inbound' && <PhoneIncoming className="h-4 w-4 text-green-600" />}
                    {call.type === 'outbound' && <PhoneOutgoing className="h-4 w-4 text-blue-600" />}
                    {call.type === 'missed' && <PhoneMissed className="h-4 w-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{call.callerName}</p>
                    <p className="text-xs text-muted-foreground">{call.caller}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{call.duration}</p>
                    <p className="text-xs text-muted-foreground">{call.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attribution */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Call Attribution</CardTitle>
            <CardDescription>Which marketing channels drive calls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {attributedCalls.map((source) => (
                <div key={source.source} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{source.source}</p>
                      <p className="text-sm">{source.calls} calls</p>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(source.calls / 345) * 100}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                      <span>{source.conversions} conversions</span>
                      <span>${source.revenue.toLocaleString()} revenue</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
