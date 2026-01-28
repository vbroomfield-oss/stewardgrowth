'use client'

import { useEffect, useState } from 'react'
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
  Target,
  Plus,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Book {
  id: string
  title: string
  subtitle: string | null
  author: string
  isbn: string | null
  asin: string | null
  description: string | null
  publishDate: string | null
  category: string | null
  price: number | null
  currency: string
  coverImage: string | null
  amazonUrl: string | null
  kindleUrl: string | null
  audibleUrl: string | null
  barnesNobleUrl: string | null
  brand: {
    id: string
    name: string
    slug: string
  }
  campaigns: Array<{
    id: string
    name: string
    type: string
    status: string
    dailyBudget: number | null
    spend: number
    sales: number
    impressions: number
    clicks: number
    orders: number
    acos: number | null
  }>
  reviews: Array<{
    id: string
    platform: string
    rating: number
    title: string | null
    content: string | null
    reviewerName: string | null
    reviewDate: string
    verified: boolean
    helpful: number
    sentiment: string | null
  }>
  metrics: {
    totalSales: number
    totalRevenue: number
    totalRoyalties: number
    totalPageReads: number
    totalAdSpend: number
    totalAdSales: number
    acos: number | null
    avgRating: number | null
    reviewCount: number
    campaignCount: number
  }
}

export default function BookDetailPage({ params }: { params: { id: string } }) {
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`/api/books/${params.id}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load book')
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load book')
        setBook(data.book)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book')
      } finally {
        setLoading(false)
      }
    }
    fetchBook()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-muted-foreground mb-4">{error || 'Book not found'}</p>
        <Button asChild>
          <Link href="/books">Back to Books</Link>
        </Button>
      </div>
    )
  }

  const { metrics } = book

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
            {book.coverImage ? (
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-24 h-36 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-36 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg flex items-center justify-center">
                <BookOpen className="h-10 w-10 text-amber-600/50" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{book.title}</h1>
              {book.subtitle && <p className="text-muted-foreground">{book.subtitle}</p>}
              <div className="flex items-center gap-4 mt-2">
                <span className="text-sm">by {book.author}</span>
                {book.isbn && <span className="text-sm text-muted-foreground">ISBN: {book.isbn}</span>}
                {metrics.avgRating && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">{metrics.avgRating.toFixed(1)}</span>
                    <span className="text-sm text-muted-foreground">({metrics.reviewCount} reviews)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {book.amazonUrl && (
            <Button variant="outline" asChild>
              <Link href={book.amazonUrl} target="_blank">
                <ExternalLink className="mr-2 h-4 w-4" />
                View on Amazon
              </Link>
            </Button>
          )}
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
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{metrics.totalSales.toLocaleString()}</p>
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
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">${metrics.totalRevenue.toLocaleString()}</p>
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
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{metrics.acos ? `${metrics.acos.toFixed(1)}%` : 'N/A'}</p>
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
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold">{metrics.reviewCount}</p>
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
            {/* Book Details */}
            <Card>
              <CardHeader>
                <CardTitle>Book Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {book.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{book.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {book.category && (
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="text-sm font-medium">{book.category}</p>
                    </div>
                  )}
                  {book.publishDate && (
                    <div>
                      <p className="text-sm text-muted-foreground">Publish Date</p>
                      <p className="text-sm font-medium">
                        {new Date(book.publishDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {book.price && (
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-sm font-medium">
                        ${book.price.toFixed(2)} {book.currency}
                      </p>
                    </div>
                  )}
                  {book.asin && (
                    <div>
                      <p className="text-sm text-muted-foreground">ASIN</p>
                      <p className="text-sm font-medium">{book.asin}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Earnings Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Earnings Breakdown</CardTitle>
                <CardDescription>Revenue and costs overview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Total Revenue</span>
                  <span className="font-semibold">${metrics.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Total Royalties</span>
                  <span className="font-semibold">${metrics.totalRoyalties.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Kindle Unlimited Page Reads</span>
                  <span className="font-semibold">{metrics.totalPageReads.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span>Ad Spend</span>
                  <span className="font-semibold text-red-600">-${metrics.totalAdSpend.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-3 border-t pt-4 mt-4">
                  <span className="font-medium">Net Profit</span>
                  <span className={cn(
                    'font-bold',
                    metrics.totalRoyalties - metrics.totalAdSpend >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    ${(metrics.totalRoyalties - metrics.totalAdSpend).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Links */}
          <Card>
            <CardHeader>
              <CardTitle>Platform Links</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {book.amazonUrl && (
                  <Button variant="outline" asChild>
                    <Link href={book.amazonUrl} target="_blank">
                      Amazon <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {book.kindleUrl && (
                  <Button variant="outline" asChild>
                    <Link href={book.kindleUrl} target="_blank">
                      Kindle <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {book.audibleUrl && (
                  <Button variant="outline" asChild>
                    <Link href={book.audibleUrl} target="_blank">
                      Audible <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {book.barnesNobleUrl && (
                  <Button variant="outline" asChild>
                    <Link href={book.barnesNobleUrl} target="_blank">
                      Barnes & Noble <ExternalLink className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                )}
                {!book.amazonUrl && !book.kindleUrl && !book.audibleUrl && !book.barnesNobleUrl && (
                  <p className="text-sm text-muted-foreground">No platform links configured</p>
                )}
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
            <Button disabled>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>

          {book.campaigns.length > 0 ? (
            <div className="space-y-4">
              {book.campaigns.map((campaign) => (
                <Card key={campaign.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{campaign.name}</h4>
                        <span className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        )}>
                          {campaign.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Spend</p>
                          <p className="font-semibold">${campaign.spend.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Sales</p>
                          <p className="font-semibold">${campaign.sales.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">ACOS</p>
                          <p className={cn(
                            'font-semibold',
                            campaign.acos && campaign.acos < 18 ? 'text-green-600' :
                            campaign.acos && campaign.acos < 22 ? 'text-yellow-600' : 'text-red-600'
                          )}>
                            {campaign.acos ? `${campaign.acos.toFixed(1)}%` : 'N/A'}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" disabled>Manage</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No campaigns yet</p>
                  <p className="text-sm mt-1">Connect your Amazon Advertising account to manage campaigns</p>
                </div>
              </CardContent>
            </Card>
          )}
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
              {book.reviews.length > 0 ? (
                <div className="space-y-4">
                  {book.reviews.map((review) => (
                    <div key={review.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={cn(
                                  'h-4 w-4',
                                  star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          {review.verified && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Verified</span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.reviewDate).toLocaleDateString()}
                        </span>
                      </div>
                      {review.title && <h4 className="font-medium">{review.title}</h4>}
                      {review.content && <p className="text-sm text-muted-foreground mt-1">{review.content}</p>}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {review.reviewerName && <span>by {review.reviewerName}</span>}
                        <span>{review.platform}</span>
                        {review.helpful > 0 && <span>{review.helpful} found helpful</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No reviews yet. Reviews will appear here once they&apos;re synced from Amazon.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
