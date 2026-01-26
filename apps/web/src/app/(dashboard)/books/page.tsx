'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  Search,
  BookOpen,
  TrendingUp,
  DollarSign,
  Users,
  Star,
  ShoppingCart,
  BarChart3,
  Calendar,
  Megaphone,
  Target,
  Mail,
  ExternalLink,
  Edit2,
  Eye,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock book data
const mockBooks = [
  {
    id: '1',
    title: 'Kingdom Leadership',
    subtitle: 'Biblical Principles for Modern Church Management',
    author: 'Vincent Broomfield',
    isbn: '978-1-234567-89-0',
    coverUrl: null,
    status: 'published',
    publishDate: '2024-06-15',
    category: 'Christian Leadership',
    metrics: {
      sales: 2847,
      salesChange: 12.5,
      revenue: 42705,
      revenueChange: 15.2,
      reviews: 187,
      avgRating: 4.7,
      adSpend: 1200,
      acos: 18.5, // Advertising Cost of Sales
    },
    platforms: {
      amazon: true,
      kindle: true,
      audible: false,
      barnesNoble: true,
    },
  },
  {
    id: '2',
    title: 'The Digital Church',
    subtitle: 'Technology Strategies for Ministry Growth',
    author: 'Vincent Broomfield',
    isbn: '978-1-234567-90-6',
    coverUrl: null,
    status: 'published',
    publishDate: '2024-09-01',
    category: 'Church Technology',
    metrics: {
      sales: 1523,
      salesChange: 8.3,
      revenue: 22845,
      revenueChange: 10.1,
      reviews: 94,
      avgRating: 4.5,
      adSpend: 800,
      acos: 22.3,
    },
    platforms: {
      amazon: true,
      kindle: true,
      audible: true,
      barnesNoble: false,
    },
  },
  {
    id: '3',
    title: 'SaaS for Churches',
    subtitle: 'Building Software that Serves Ministries',
    author: 'Vincent Broomfield',
    isbn: '978-1-234567-91-3',
    coverUrl: null,
    status: 'pre-launch',
    publishDate: '2025-03-15',
    category: 'Business',
    metrics: {
      sales: 0,
      salesChange: 0,
      revenue: 0,
      revenueChange: 0,
      reviews: 0,
      avgRating: 0,
      adSpend: 500,
      acos: 0,
    },
    platforms: {
      amazon: false,
      kindle: false,
      audible: false,
      barnesNoble: false,
    },
  },
]

const mockCampaigns = [
  {
    id: '1',
    bookId: '1',
    name: 'Kingdom Leadership - Amazon Sponsored',
    type: 'amazon_sponsored',
    status: 'active',
    budget: 50,
    spent: 847,
    sales: 156,
    acos: 18.2,
  },
  {
    id: '2',
    bookId: '1',
    name: 'Kingdom Leadership - Keyword Targeting',
    type: 'amazon_keyword',
    status: 'active',
    budget: 30,
    spent: 412,
    sales: 89,
    acos: 15.5,
  },
  {
    id: '3',
    bookId: '2',
    name: 'Digital Church - Launch Campaign',
    type: 'amazon_sponsored',
    status: 'active',
    budget: 40,
    spent: 623,
    sales: 102,
    acos: 20.4,
  },
  {
    id: '4',
    bookId: '3',
    name: 'SaaS for Churches - Pre-order Push',
    type: 'facebook_ads',
    status: 'scheduled',
    budget: 100,
    spent: 0,
    sales: 0,
    acos: 0,
  },
]

const mockLaunches = [
  {
    id: '1',
    bookId: '3',
    title: 'SaaS for Churches Book Launch',
    launchDate: '2025-03-15',
    status: 'planning',
    tasks: [
      { name: 'Email list announcement', done: true },
      { name: 'Pre-order page setup', done: true },
      { name: 'Review copies sent', done: false },
      { name: 'Podcast tour scheduled', done: false },
      { name: 'Launch day email sequence', done: false },
      { name: 'Amazon Ads campaign ready', done: false },
    ],
    emailListSize: 4521,
    preOrders: 234,
  },
]

// Calculate totals
const totalMetrics = mockBooks.reduce(
  (acc, book) => ({
    sales: acc.sales + book.metrics.sales,
    revenue: acc.revenue + book.metrics.revenue,
    reviews: acc.reviews + book.metrics.reviews,
    adSpend: acc.adSpend + book.metrics.adSpend,
  }),
  { sales: 0, revenue: 0, reviews: 0, adSpend: 0 }
)

export default function BooksPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredBooks = mockBooks.filter(
    (book) =>
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-amber-600" />
            Book Marketing
          </h1>
          <p className="text-muted-foreground">
            Manage your books, Amazon Ads, and launch campaigns
          </p>
        </div>
        <Button asChild>
          <Link href="/books/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBooks.length}</p>
                <p className="text-sm text-muted-foreground">Total Books</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(totalMetrics.revenue / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMetrics.sales.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Sales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMetrics.reviews}</p>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="books">
        <TabsList>
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="campaigns">Ad Campaigns</TabsTrigger>
          <TabsTrigger value="launches">Launch Plans</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
        </TabsList>

        {/* Books Tab */}
        <TabsContent value="books" className="space-y-6 mt-6">
          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search books..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Book Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredBooks.map((book) => (
              <Card key={book.id} className="overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-amber-600/50" />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{book.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{book.subtitle}</p>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        book.status === 'published'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30'
                      )}
                    >
                      {book.status === 'published' ? 'Published' : 'Pre-Launch'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Sales</p>
                      <p className="font-semibold">{book.metrics.sales.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Revenue</p>
                      <p className="font-semibold">${book.metrics.revenue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Reviews</p>
                      <p className="font-semibold flex items-center gap-1">
                        {book.metrics.reviews}
                        {book.metrics.avgRating > 0 && (
                          <span className="text-yellow-500 flex items-center">
                            <Star className="h-3 w-3 fill-current" />
                            {book.metrics.avgRating}
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ACOS</p>
                      <p className={cn(
                        'font-semibold',
                        book.metrics.acos > 25 ? 'text-red-600' : book.metrics.acos > 20 ? 'text-yellow-600' : 'text-green-600'
                      )}>
                        {book.metrics.acos > 0 ? `${book.metrics.acos}%` : '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/books/${book.id}`}>
                        <Eye className="mr-2 h-3 w-3" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/books/${book.id}/campaigns`}>
                        <Megaphone className="mr-2 h-3 w-3" />
                        Ads
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Campaigns Tab */}
        <TabsContent value="campaigns" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Amazon Ads & Marketing Campaigns</CardTitle>
                  <CardDescription>Manage your book advertising across platforms</CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Campaign
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockCampaigns.map((campaign) => {
                  const book = mockBooks.find((b) => b.id === campaign.bookId)
                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'p-2 rounded-lg',
                            campaign.type.includes('amazon')
                              ? 'bg-orange-100 dark:bg-orange-900/30'
                              : 'bg-blue-100 dark:bg-blue-900/30'
                          )}
                        >
                          {campaign.type.includes('amazon') ? (
                            <ShoppingCart className="h-5 w-5 text-orange-600" />
                          ) : (
                            <Megaphone className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {book?.title} • ${campaign.budget}/day budget
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Spent</p>
                          <p className="font-semibold">${campaign.spent}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Sales</p>
                          <p className="font-semibold">{campaign.sales}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">ACOS</p>
                          <p
                            className={cn(
                              'font-semibold',
                              campaign.acos > 25
                                ? 'text-red-600'
                                : campaign.acos > 20
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            )}
                          >
                            {campaign.acos > 0 ? `${campaign.acos}%` : '-'}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'text-xs px-2 py-1 rounded-full',
                            campaign.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-blue-100 text-blue-700'
                          )}
                        >
                          {campaign.status}
                        </span>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations for Book Ads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-500" />
                AI Ad Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/50">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Increase &quot;Kingdom Leadership&quot; Budget</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Your ACOS of 18.2% is well below your 25% target. Increasing daily budget from
                      $50 to $75 could yield an additional 45 sales/month with similar efficiency.
                    </p>
                    <p className="text-sm text-green-600 font-medium mt-2">
                      Projected Impact: +$675 revenue, 18-20% ACOS
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm">Apply Recommendation</Button>
                      <Button size="sm" variant="outline">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                    <Target className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <h4 className="font-medium">Add Category Targeting for &quot;Digital Church&quot;</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Competitors in &quot;Church Administration&quot; category have lower CPCs. Adding
                      category targeting could reduce your ACOS from 22.3% to ~19%.
                    </p>
                    <p className="text-sm text-green-600 font-medium mt-2">
                      Projected Impact: -15% ACOS, same sales volume
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm">Apply Recommendation</Button>
                      <Button size="sm" variant="outline">
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Launches Tab */}
        <TabsContent value="launches" className="space-y-6 mt-6">
          {mockLaunches.map((launch) => {
            const book = mockBooks.find((b) => b.id === launch.bookId)
            const completedTasks = launch.tasks.filter((t) => t.done).length
            const progress = (completedTasks / launch.tasks.length) * 100

            return (
              <Card key={launch.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{launch.title}</CardTitle>
                      <CardDescription>
                        Launch Date: {new Date(launch.launchDate).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </CardDescription>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-3 py-1 rounded-full',
                        launch.status === 'planning'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      )}
                    >
                      {launch.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Progress */}
                    <div className="md:col-span-2">
                      <h4 className="font-medium mb-3">Launch Checklist</h4>
                      <div className="space-y-2">
                        {launch.tasks.map((task, i) => (
                          <div
                            key={i}
                            className={cn(
                              'flex items-center gap-3 p-2 rounded',
                              task.done ? 'bg-green-50 dark:bg-green-900/20' : 'bg-muted/50'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={task.done}
                              readOnly
                              className="h-4 w-4 rounded"
                            />
                            <span
                              className={cn(
                                'text-sm',
                                task.done && 'line-through text-muted-foreground'
                              )}
                            >
                              {task.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{completedTasks}/{launch.tasks.length} tasks</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                          <div
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="space-y-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Email List</span>
                        </div>
                        <p className="text-2xl font-bold">{launch.emailListSize.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">subscribers</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Pre-Orders</span>
                        </div>
                        <p className="text-2xl font-bold">{launch.preOrders}</p>
                        <p className="text-xs text-muted-foreground">orders placed</p>
                      </div>
                      <Button className="w-full">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Full Plan
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          <Button variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Create Launch Plan
          </Button>
        </TabsContent>

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Review Management</CardTitle>
              <CardDescription>
                Monitor and respond to reviews across all platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Review Summary */}
                <div className="grid md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <p className="text-3xl font-bold">281</p>
                    <p className="text-sm text-muted-foreground">Total Reviews</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold flex items-center justify-center gap-1">
                      4.6 <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Rating</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">12</p>
                    <p className="text-sm text-muted-foreground">New This Week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">3</p>
                    <p className="text-sm text-muted-foreground">Need Response</p>
                  </div>
                </div>

                {/* Recent Reviews */}
                <h4 className="font-medium pt-4">Recent Reviews</h4>
                <div className="space-y-4">
                  {[
                    {
                      book: 'Kingdom Leadership',
                      rating: 5,
                      text: 'Excellent resource for church leaders. Practical and biblically grounded.',
                      author: 'Pastor Mike T.',
                      date: '2 days ago',
                      platform: 'Amazon',
                    },
                    {
                      book: 'The Digital Church',
                      rating: 4,
                      text: 'Great overview of technology options. Would have liked more specific implementation guides.',
                      author: 'Admin Sarah',
                      date: '4 days ago',
                      platform: 'Amazon',
                    },
                    {
                      book: 'Kingdom Leadership',
                      rating: 3,
                      text: 'Good information but felt a bit repetitive in places.',
                      author: 'J. Smith',
                      date: '1 week ago',
                      platform: 'Goodreads',
                      needsResponse: true,
                    },
                  ].map((review, i) => (
                    <div key={i} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{review.book}</span>
                            <span className="text-xs text-muted-foreground">• {review.platform}</span>
                            {review.needsResponse && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                Needs Response
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  'h-4 w-4',
                                  i < review.rating
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">{review.text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {review.author} • {review.date}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="mr-2 h-3 w-3" />
                          Respond
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
