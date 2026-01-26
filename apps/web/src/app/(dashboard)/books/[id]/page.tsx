'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  BookOpen,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Star,
  Edit2,
  ExternalLink,
  Megaphone,
  BarChart3,
  Calendar,
  Target,
  Plus,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock book data (would come from API)
const mockBook = {
  id: '1',
  title: 'Kingdom Leadership',
  subtitle: 'Biblical Principles for Modern Church Management',
  author: 'Vincent Broomfield',
  isbn: '978-1-234567-89-0',
  description: 'A comprehensive guide to leading churches with biblical wisdom and modern best practices.',
  publishDate: '2024-06-15',
  category: 'Christian Leadership',
  price: 14.99,
  platforms: {
    amazon: 'https://amazon.com/dp/B0XXXXXX',
    kindle: 'https://amazon.com/dp/B0XXXXXX',
    audible: null,
    barnesNoble: 'https://barnesandnoble.com/w/XXXXX',
  },
}

const mockMetrics = {
  current: {
    sales: 2847,
    revenue: 42705,
    adSpend: 1200,
    acos: 18.5,
    reviews: 187,
    avgRating: 4.7,
    royalties: 8541,
    pageReads: 45600, // Kindle Unlimited
  },
  previous: {
    sales: 2531,
    revenue: 37965,
    adSpend: 1100,
    acos: 19.2,
    reviews: 165,
    avgRating: 4.6,
    royalties: 7593,
    pageReads: 41200,
  },
}

const mockCampaigns = [
  { id: '1', name: 'Sponsored Products - Auto', status: 'active', spend: 412, sales: 78, acos: 17.8 },
  { id: '2', name: 'Sponsored Products - Manual', status: 'active', spend: 287, sales: 52, acos: 18.5 },
  { id: '3', name: 'Sponsored Brands', status: 'active', spend: 148, sales: 26, acos: 19.2 },
]

const mockSalesHistory = [
  { date: 'Jan 1', sales: 82 },
  { date: 'Jan 8', sales: 95 },
  { date: 'Jan 15', sales: 78 },
  { date: 'Jan 22', sales: 112 },
  { date: 'Jan 29', sales: 98 },
]

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const metrics = mockMetrics

  const changes = {
    sales: calculateChange(metrics.current.sales, metrics.previous.sales),
    revenue: calculateChange(metrics.current.revenue, metrics.previous.revenue),
    acos: calculateChange(metrics.current.acos, metrics.previous.acos),
    reviews: calculateChange(metrics.current.reviews, metrics.previous.reviews),
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/books">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex gap-6">
            <div className="w-24 h-36 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg flex items-center justify-center">
              <BookOpen className="h-10 w-10 text-amber-600/50" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{mockBook.title}</h1>
              <p className="text-muted-foreground">{mockBook.subtitle}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm">by {mockBook.author}</span>
                <span className="text-sm text-muted-foreground">ISBN: {mockBook.isbn}</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{metrics.current.avgRating}</span>
                  <span className="text-sm text-muted-foreground">({metrics.current.reviews} reviews)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={mockBook.platforms.amazon || '#'} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Amazon
            </Link>
          </Button>
          <Button variant="outline">
            <Edit2 className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <span className={cn(
                'text-xs flex items-center gap-1',
                changes.sales >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {changes.sales >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(changes.sales).toFixed(1)}%
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{metrics.current.sales.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Sales</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <span className={cn(
                'text-xs flex items-center gap-1',
                changes.revenue >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {changes.revenue >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(changes.revenue).toFixed(1)}%
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">${metrics.current.revenue.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Target className="h-5 w-5 text-purple-600" />
              </div>
              <span className={cn(
                'text-xs flex items-center gap-1',
                changes.acos <= 0 ? 'text-green-600' : 'text-yellow-600'
              )}>
                {changes.acos <= 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                {Math.abs(changes.acos).toFixed(1)}%
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{metrics.current.acos}%</p>
              <p className="text-sm text-muted-foreground">ACOS</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <span className={cn(
                'text-xs flex items-center gap-1',
                changes.reviews >= 0 ? 'text-green-600' : 'text-red-600'
              )}>
                {changes.reviews >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(changes.reviews).toFixed(1)}%
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{metrics.current.reviews}</p>
              <p className="text-sm text-muted-foreground">Reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="campaigns">Ad Campaigns</TabsTrigger>
          <TabsTrigger value="keywords">Keywords</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Sales Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Weekly sales over the past 5 weeks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-48 flex items-end justify-between gap-2">
                  {mockSalesHistory.map((week, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-blue-500 rounded-t"
                        style={{ height: `${(week.sales / 120) * 100}%` }}
                      />
                      <span className="text-xs text-muted-foreground">{week.date}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Earnings Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
                <CardDescription>This month&apos;s revenue sources</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Book Sales</span>
                  <span className="font-semibold">${(metrics.current.revenue * 0.7).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Kindle Unlimited (KENP)</span>
                  <span className="font-semibold">${(metrics.current.pageReads * 0.0045).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Audible</span>
                  <span className="font-semibold text-muted-foreground">Not available</span>
                </div>
                <div className="flex items-center justify-between p-3 border-t pt-4 mt-4">
                  <span className="font-medium">Net After Ad Spend</span>
                  <span className="font-bold text-green-600">
                    ${(metrics.current.royalties - metrics.current.adSpend).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-400">Scale Your Auto Campaign</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Your auto-targeting campaign has the best ACOS at 17.8%. Increasing budget by 50% could yield an
                  estimated 39 additional sales while maintaining efficiency.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700">Apply</Button>
                  <Button size="sm" variant="outline">Dismiss</Button>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <h4 className="font-medium text-yellow-700 dark:text-yellow-400">Review Velocity Opportunity</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  You&apos;re averaging 5.5 reviews/week. Launching a review request email campaign to recent buyers
                  could increase this to 8-10 reviews/week, improving conversion rates.
                </p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">Create Campaign</Button>
                  <Button size="sm" variant="outline">Learn More</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Amazon Advertising Campaigns</h3>
              <p className="text-sm text-muted-foreground">Manage your Sponsored Products and Brands campaigns</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>

          <div className="space-y-4">
            {mockCampaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{campaign.name}</h4>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {campaign.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Spend</p>
                        <p className="font-semibold">${campaign.spend}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Sales</p>
                        <p className="font-semibold">{campaign.sales}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">ACOS</p>
                        <p className={cn(
                          'font-semibold',
                          campaign.acos < 18 ? 'text-green-600' : campaign.acos < 22 ? 'text-yellow-600' : 'text-red-600'
                        )}>
                          {campaign.acos}%
                        </p>
                      </div>
                      <Button variant="outline" size="sm">Manage</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="keywords" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Keyword Performance</CardTitle>
              <CardDescription>Top performing keywords from your campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Connect your Amazon Advertising account to see keyword performance
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Management</CardTitle>
              <CardDescription>Recent reviews and response management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Review data will sync from Amazon
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
