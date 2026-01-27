'use client'

import { useEffect, useState } from 'react'
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
  Loader2,
  Inbox,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EventSummary {
  name: string
  count: number
  change: number
}

interface RecentEvent {
  id: string
  event: string
  user: string
  brand: string
  time: string
  properties: Record<string, any>
}

const eventIcons: Record<string, typeof Eye> = {
  page_view: Eye,
  button_click: MousePointer,
  signup_started: UserPlus,
  signup_completed: UserPlus,
  trial_started: Zap,
  subscription_started: CreditCard,
  identify: UserPlus,
}

export default function EventsPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [summary, setSummary] = useState<EventSummary[]>([])
  const [events, setEvents] = useState<RecentEvent[]>([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)

  async function fetchEvents() {
    try {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed to fetch events')
      const data = await res.json()

      if (data.success) {
        setSummary(data.summary || [])
        setEvents(data.events || [])
        setTotal(data.total || 0)
        setError(null)
      } else {
        throw new Error(data.error || 'Failed to load events')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchEvents()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => { setLoading(true); fetchEvents(); }}>Try Again</Button>
      </div>
    )
  }

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
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
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
      {summary.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {summary.map((event) => {
            const Icon = eventIcons[event.name] || Zap
            return (
              <Card key={event.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {event.change !== 0 && (
                      <span className={cn(
                        "text-xs",
                        event.change > 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {event.change > 0 ? '+' : ''}{event.change}%
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold">{event.count.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground font-mono">{event.name}</p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <Inbox className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No events recorded yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add the tracking snippet to your website to start collecting events
            </p>
          </CardContent>
        </Card>
      )}

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
              <CardDescription>
                {total > 0 ? `${total.toLocaleString()} total events tracked` : 'Real-time events from your tracking SDK'}
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'px-2 py-1 rounded text-xs font-mono',
                      event.event.includes('subscription') && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      event.event.includes('signup') && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                      event.event.includes('trial') && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                      event.event === 'page_view' && 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
                      event.event === 'button_click' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                      event.event === 'identify' && 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
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
                    {Object.keys(event.properties).length > 0 && (
                      <p className="text-xs font-mono text-muted-foreground">
                        {JSON.stringify(event.properties).slice(0, 30)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-8 w-8 mx-auto mb-3 opacity-50" />
              <p>No events yet</p>
              <p className="text-sm mt-1">Events will appear here as they come in</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
