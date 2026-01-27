'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { BrandCard } from '@/components/dashboard/brand-card'
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  Clock,
  Plus,
  Loader2,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  domain: string | null
  color: string
  metrics: {
    mrr: number
    mrrChange: number
    leads: number
    leadsChange: number
    trials: number
    adSpend: number
  }
}

interface DashboardData {
  brands: Brand[]
  metrics: {
    totalMrr: number
    previousMrr: number
    totalLeads: number
    previousLeads: number
    conversionRate: number
    previousConversionRate: number
    totalAdSpend: number
    previousAdSpend: number
  }
  weeklyStats: {
    contentPublished: number
    seoTasksCompleted: number
    seoTasksTotal: number
    activeCampaigns: number
    callsAttributed: number
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch brands
        const brandsRes = await fetch('/api/brands')
        if (!brandsRes.ok) throw new Error('Failed to load brands')
        const brandsData = await brandsRes.json()

        // Transform brands to include metrics
        const brands: Brand[] = (brandsData.brands || []).map((brand: any) => ({
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          domain: brand.domain,
          color: brand.color || '#3b82f6',
          metrics: {
            mrr: brand.metrics?.mrr || 0,
            mrrChange: brand.metrics?.mrrChange || 0,
            leads: brand.metrics?.leads || 0,
            leadsChange: brand.metrics?.leadsChange || 0,
            trials: brand.metrics?.trials || 0,
            adSpend: brand.metrics?.adSpend || 0,
          },
        }))

        // Calculate totals from brands
        const totalMrr = brands.reduce((sum, b) => sum + b.metrics.mrr, 0)
        const totalLeads = brands.reduce((sum, b) => sum + b.metrics.leads, 0)
        const totalAdSpend = brands.reduce((sum, b) => sum + b.metrics.adSpend, 0)

        setData({
          brands,
          metrics: {
            totalMrr,
            previousMrr: 0, // We'd need historical data to calculate this
            totalLeads,
            previousLeads: 0,
            conversionRate: totalLeads > 0 ? (brands.reduce((sum, b) => sum + b.metrics.trials, 0) / totalLeads) * 100 : 0,
            previousConversionRate: 0,
            totalAdSpend,
            previousAdSpend: 0,
          },
          weeklyStats: {
            contentPublished: 0,
            seoTasksCompleted: 0,
            seoTasksTotal: 0,
            activeCampaigns: 0,
            callsAttributed: 0,
          },
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

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
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  const hasBrands = data && data.brands.length > 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {hasBrands
              ? 'Marketing performance across all brands'
              : 'Get started by adding your first brand'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasBrands && (
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Last 30 days
            </Button>
          )}
          <Button asChild>
            <Link href="/brands/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Link>
          </Button>
        </div>
      </div>

      {!hasBrands ? (
        // Empty state - no brands yet
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Welcome to StewardGrowth</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add your first brand to start tracking marketing performance,
              generating AI-powered content, and optimizing your campaigns.
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
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total MRR"
              value={data.metrics.totalMrr}
              previousValue={data.metrics.previousMrr}
              format="currency"
              icon={DollarSign}
            />
            <MetricCard
              title="Total Leads"
              value={data.metrics.totalLeads}
              previousValue={data.metrics.previousLeads}
              icon={Users}
            />
            <MetricCard
              title="Conversion Rate"
              value={data.metrics.conversionRate}
              previousValue={data.metrics.previousConversionRate}
              format="percent"
              icon={TrendingUp}
            />
            <MetricCard
              title="Ad Spend"
              value={data.metrics.totalAdSpend}
              previousValue={data.metrics.previousAdSpend}
              format="currency"
              icon={Target}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left column - Brands */}
            <div className="lg:col-span-2 space-y-6">
              {/* Brand Performance */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Brand Performance</CardTitle>
                    <CardDescription>Overview of all SaaS brands</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/brands">
                      View all
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {data.brands.slice(0, 6).map((brand) => (
                      <BrandCard key={brand.id} brand={{
                        ...brand,
                        domain: brand.domain || undefined,
                      }} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* AI Recommendations - placeholder until we have real data */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>
                      Actions suggested by the AI decision engine
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/ai">
                      View all
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-8 w-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      AI recommendations will appear here as you collect more data.
                    </p>
                    <p className="text-xs mt-1">
                      Add tracking to your brands to start receiving insights.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/brands/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Add New Brand
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/content">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Content
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/seo">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      SEO Dashboard
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/analytics">
                      <Target className="mr-2 h-4 w-4" />
                      View Analytics
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Weekly Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>This Week</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Brands tracked</span>
                    <span className="font-semibold">{data.brands.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Events tracked</span>
                    <span className="font-semibold">
                      {data.brands.reduce((sum, b) => sum + (b.metrics.leads || 0), 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Content published</span>
                    <span className="font-semibold">{data.weeklyStats.contentPublished}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active campaigns</span>
                    <span className="font-semibold">{data.weeklyStats.activeCampaigns}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
