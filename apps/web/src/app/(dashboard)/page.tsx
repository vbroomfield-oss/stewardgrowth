'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MetricCard } from '@/components/dashboard/metric-card'
import { BrandCard } from '@/components/dashboard/brand-card'
import { RecommendationCard } from '@/components/dashboard/recommendation-card'
import { ApprovalItem } from '@/components/dashboard/approval-item'
import {
  DollarSign,
  Users,
  TrendingUp,
  Target,
  ArrowRight,
  Sparkles,
  Clock,
} from 'lucide-react'

// Mock data - will be replaced with real API calls
const mockMetrics = {
  totalMrr: 125000,
  previousMrr: 118000,
  totalLeads: 2847,
  previousLeads: 2456,
  conversionRate: 4.2,
  previousConversionRate: 3.8,
  totalAdSpend: 15420,
  previousAdSpend: 14200,
}

const mockBrands = [
  {
    id: '1',
    name: 'StewardMAX',
    slug: 'stewardmax',
    domain: 'stewardmax.com',
    color: '#3b82f6',
    metrics: {
      mrr: 75000,
      mrrChange: 8.5,
      leads: 1523,
      leadsChange: 12.3,
      trials: 234,
      adSpend: 8500,
    },
  },
  {
    id: '2',
    name: 'StewardRing',
    slug: 'stewardring',
    domain: 'stewardring.com',
    color: '#22c55e',
    metrics: {
      mrr: 35000,
      mrrChange: 5.2,
      leads: 892,
      leadsChange: 15.7,
      trials: 156,
      adSpend: 4200,
    },
  },
  {
    id: '3',
    name: 'StewardPro',
    slug: 'stewardpro',
    domain: 'stewardpro.io',
    color: '#a855f7',
    metrics: {
      mrr: 15000,
      mrrChange: -2.1,
      leads: 432,
      leadsChange: -5.3,
      trials: 67,
      adSpend: 2720,
    },
  },
]

const mockRecommendations = [
  {
    type: 'opportunity' as const,
    title: 'Scale Google Ads campaign "Church Management"',
    description: 'This campaign has a 2.3x ROAS and is under daily budget. Increasing spend by 40% could yield 25+ more leads/week.',
    impact: '+25 leads/week',
    brand: 'StewardMAX',
  },
  {
    type: 'warning' as const,
    title: 'High bounce rate on pricing page',
    description: 'StewardRing pricing page has 78% bounce rate, up 15% this week. Consider A/B testing pricing presentation.',
    brand: 'StewardRing',
  },
  {
    type: 'insight' as const,
    title: 'Trending keyword opportunity',
    description: '"AI church software" searches up 340% this month. No current content targeting this term.',
    impact: '+500 monthly visits potential',
    brand: 'StewardMAX',
  },
]

const mockApprovals = [
  {
    type: 'content' as const,
    title: 'LinkedIn post: "5 Ways AI Transforms Church Management"',
    description: 'AI-generated content for weekly social campaign',
    brand: 'StewardMAX',
    createdAt: '2 hours ago',
  },
  {
    type: 'budget' as const,
    title: 'Increase Meta Ads daily budget',
    description: 'Proposal to increase from $50 to $75/day',
    brand: 'StewardRing',
    amount: 750,
    createdAt: '5 hours ago',
  },
  {
    type: 'campaign' as const,
    title: 'Launch "VoIP for Churches" campaign',
    description: 'New Google Ads campaign targeting church VoIP keywords',
    brand: 'StewardRing',
    amount: 1500,
    createdAt: '1 day ago',
  },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Marketing performance across all brands
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Clock className="mr-2 h-4 w-4" />
            Last 30 days
          </Button>
          <Button>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total MRR"
          value={mockMetrics.totalMrr}
          previousValue={mockMetrics.previousMrr}
          format="currency"
          icon={DollarSign}
        />
        <MetricCard
          title="Total Leads"
          value={mockMetrics.totalLeads}
          previousValue={mockMetrics.previousLeads}
          icon={Users}
        />
        <MetricCard
          title="Conversion Rate"
          value={mockMetrics.conversionRate}
          previousValue={mockMetrics.previousConversionRate}
          format="percent"
          icon={TrendingUp}
        />
        <MetricCard
          title="Ad Spend"
          value={mockMetrics.totalAdSpend}
          previousValue={mockMetrics.previousAdSpend}
          format="currency"
          icon={Target}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - Brands & Recommendations */}
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
                {mockBrands.map((brand) => (
                  <BrandCard key={brand.id} brand={brand} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
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
            <CardContent className="space-y-4">
              {mockRecommendations.map((rec, index) => (
                <RecommendationCard
                  key={index}
                  {...rec}
                  onAccept={() => console.log('Accept:', rec.title)}
                  onDismiss={() => console.log('Dismiss:', rec.title)}
                />
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right column - Approvals */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>
                  {mockApprovals.length} items need your review
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/approvals">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockApprovals.map((approval, index) => (
                <ApprovalItem
                  key={index}
                  {...approval}
                  onApprove={() => console.log('Approve:', approval.title)}
                  onReject={() => console.log('Reject:', approval.title)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Content published</span>
                <span className="font-semibold">12 posts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">SEO tasks completed</span>
                <span className="font-semibold">8 / 15</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Campaigns active</span>
                <span className="font-semibold">7 campaigns</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Calls attributed</span>
                <span className="font-semibold">34 calls</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
