'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Search,
  Globe,
  TrendingUp,
  BarChart3,
  MousePointerClick,
  Eye,
  Hash,
  Loader2,
  AlertCircle,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type DateRange = '7d' | '30d' | '90d'
type ActiveTab = 'keywords' | 'pages'

interface KeywordRow {
  keyword: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface PageRow {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface Summary {
  totalKeywords: number
  totalClicks: number
  totalImpressions: number
  avgPosition: number
  avgCtr: number
}

interface SearchConsoleResponse {
  success: boolean
  dimension: string
  range: string
  summary: Summary
  data: KeywordRow[] | PageRow[]
  error?: string
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
  return num.toLocaleString()
}

function PositionBadge({ position }: { position: number }) {
  const color =
    position <= 3
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : position <= 10
        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        : position <= 20
          ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'

  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', color)}>
      {position.toFixed(1)}
    </span>
  )
}

export default function SEOPage() {
  const [range, setRange] = useState<DateRange>('30d')
  const [activeTab, setActiveTab] = useState<ActiveTab>('keywords')
  const [loading, setLoading] = useState(true)
  const [notConfigured, setNotConfigured] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [summary, setSummary] = useState<Summary>({
    totalKeywords: 0,
    totalClicks: 0,
    totalImpressions: 0,
    avgPosition: 0,
    avgCtr: 0,
  })
  const [keywords, setKeywords] = useState<KeywordRow[]>([])
  const [pages, setPages] = useState<PageRow[]>([])
  const [loadingPages, setLoadingPages] = useState(false)

  const fetchKeywords = useCallback(async (r: DateRange) => {
    setLoading(true)
    setNotConfigured(false)
    setErrorMessage(null)
    try {
      const res = await fetch(`/api/seo/search-console?dimension=query&range=${r}`, {
        credentials: 'include',
      })
      const json: SearchConsoleResponse = await res.json()

      if (!res.ok || !json.success) {
        const msg = json.error || 'Failed to fetch data'
        if (msg.toLowerCase().includes('not configured')) {
          setNotConfigured(true)
        } else {
          setErrorMessage(msg)
        }
        setSummary({ totalKeywords: 0, totalClicks: 0, totalImpressions: 0, avgPosition: 0, avgCtr: 0 })
        setKeywords([])
        return
      }

      setSummary(json.summary)
      setKeywords(json.data as KeywordRow[])
    } catch (err) {
      console.error('Failed to fetch keyword data:', err)
      setErrorMessage('Unable to connect to the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPages = useCallback(async (r: DateRange) => {
    setLoadingPages(true)
    try {
      const res = await fetch(`/api/seo/search-console?dimension=page&range=${r}`, {
        credentials: 'include',
      })
      const json: SearchConsoleResponse = await res.json()

      if (res.ok && json.success) {
        setPages(json.data as PageRow[])
      } else {
        setPages([])
      }
    } catch (err) {
      console.error('Failed to fetch page data:', err)
      setPages([])
    } finally {
      setLoadingPages(false)
    }
  }, [])

  // Fetch keyword data on mount and when range changes
  useEffect(() => {
    fetchKeywords(range)
  }, [range, fetchKeywords])

  // Fetch pages data when the pages tab is activated or range changes
  useEffect(() => {
    if (activeTab === 'pages') {
      fetchPages(range)
    }
  }, [activeTab, range, fetchPages])

  const ranges: { value: DateRange; label: string }[] = [
    { value: '7d', label: '7 days' },
    { value: '30d', label: '30 days' },
    { value: '90d', label: '90 days' },
  ]

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Not configured state
  if (notConfigured) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Search className="h-8 w-8 text-green-500" />
            SEO Dashboard
          </h1>
          <p className="text-muted-foreground">
            Keyword rankings, search performance, and visibility insights
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-green-500/10 p-4 mb-4">
              <Globe className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Google Search Console Not Connected</h3>
            <p className="text-muted-foreground text-center max-w-md mb-2">
              Connect your Google Search Console account to start tracking keyword rankings,
              impressions, clicks, and search performance data.
            </p>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Go to <span className="font-medium text-foreground">Settings</span> &rarr;{' '}
              <span className="font-medium text-foreground">Integrations</span> to configure
              your Search Console connection.
            </p>
            <Button asChild size="lg">
              <Link href="/settings?tab=integrations">
                <Settings className="mr-2 h-4 w-4" />
                Configure in Settings
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state (non-configuration errors)
  if (errorMessage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Search className="h-8 w-8 text-green-500" />
            SEO Dashboard
          </h1>
          <p className="text-muted-foreground">
            Keyword rankings, search performance, and visibility insights
          </p>
        </div>

        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 dark:text-red-100">Failed to load SEO data</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{errorMessage}</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => fetchKeywords(range)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Search className="h-8 w-8 text-green-500" />
            SEO Dashboard
          </h1>
          <p className="text-muted-foreground">
            Keyword rankings, search performance, and visibility insights
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {ranges.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setRange(r.value)}
              className={cn(
                'text-sm',
                range === r.value
                  ? ''
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {r.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Keywords Tracked</p>
              <Hash className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalKeywords)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Avg Position</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{summary.avgPosition.toFixed(1)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Impressions</p>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalImpressions)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Clicks</p>
              <MousePointerClick className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold mt-2">{formatNumber(summary.totalClicks)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Selector + Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-500" />
                Search Performance
              </CardTitle>
              <CardDescription>
                {activeTab === 'keywords'
                  ? 'Keyword rankings from Google Search Console'
                  : 'Top performing pages from Google Search Console'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={activeTab === 'keywords' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('keywords')}
                className={cn(
                  'text-sm',
                  activeTab === 'keywords' ? '' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Keywords
              </Button>
              <Button
                variant={activeTab === 'pages' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab('pages')}
                className={cn(
                  'text-sm',
                  activeTab === 'pages' ? '' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Top Pages
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Keywords Tab */}
          {activeTab === 'keywords' && (
            <>
              {keywords.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No keyword data available for this period</p>
                  <p className="text-sm mt-1">Try selecting a longer date range</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Keyword</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Position</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Clicks</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Impressions</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">CTR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywords.map((row, i) => (
                        <tr
                          key={row.keyword + i}
                          className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-3 pr-4">
                            <span className="font-medium">{row.keyword}</span>
                          </td>
                          <td className="py-3 text-right">
                            <PositionBadge position={row.position} />
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {row.clicks.toLocaleString()}
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {row.impressions.toLocaleString()}
                          </td>
                          <td className="py-3 text-right tabular-nums">
                            {(row.ctr * 100).toFixed(2)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Pages Tab */}
          {activeTab === 'pages' && (
            <>
              {loadingPages ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : pages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No page data available for this period</p>
                  <p className="text-sm mt-1">Try selecting a longer date range</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium text-muted-foreground">Page</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Clicks</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Impressions</th>
                        <th className="pb-3 font-medium text-muted-foreground text-right">Avg Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pages.map((row, i) => {
                        let displayUrl = row.page
                        try {
                          const url = new URL(row.page)
                          displayUrl = url.pathname + url.search
                        } catch {
                          // use raw value
                        }
                        return (
                          <tr
                            key={row.page + i}
                            className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                          >
                            <td className="py-3 pr-4 max-w-md">
                              <span
                                className="font-medium truncate block"
                                title={row.page}
                              >
                                {displayUrl}
                              </span>
                            </td>
                            <td className="py-3 text-right tabular-nums">
                              {row.clicks.toLocaleString()}
                            </td>
                            <td className="py-3 text-right tabular-nums">
                              {row.impressions.toLocaleString()}
                            </td>
                            <td className="py-3 text-right">
                              <PositionBadge position={row.position} />
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
