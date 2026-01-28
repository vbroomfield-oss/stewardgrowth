'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Plus,
  BookOpen,
  DollarSign,
  ShoppingCart,
  Star,
  Megaphone,
  Calendar,
  Loader2,
  ExternalLink,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
}

interface Book {
  id: string
  title: string
  subtitle: string | null
  author: string
  coverImage: string | null
  category: string | null
  publishDate: string | null
  price: number | null
  amazonUrl: string | null
  brand: {
    id: string
    name: string
    slug: string
  }
  metrics: {
    totalSales: number
    totalRevenue: number
    totalRoyalties: number
    avgRating: number | null
    reviewCount: number
    campaignCount: number
  }
}

export default function BooksPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [brandsRes, booksRes] = await Promise.all([
          fetch('/api/brands', { credentials: 'include' }),
          fetch('/api/books', { credentials: 'include' }),
        ])

        if (brandsRes.ok) {
          const data = await brandsRes.json()
          setBrands(data.brands || [])
        }

        if (booksRes.ok) {
          const data = await booksRes.json()
          setBooks(data.books || [])
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-amber-500/10 p-4 mb-4">
              <BookOpen className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand first to start managing your book marketing, Amazon Ads campaigns, and book launches.
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
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <BookOpen className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{books.length}</p>
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
                    <p className="text-2xl font-bold">
                      ${books.reduce((sum, b) => sum + b.metrics.totalRevenue, 0).toLocaleString()}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {books.reduce((sum, b) => sum + b.metrics.totalSales, 0).toLocaleString()}
                    </p>
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
                    <p className="text-2xl font-bold">
                      {books.reduce((sum, b) => sum + b.metrics.reviewCount, 0).toLocaleString()}
                    </p>
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
              {books.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No books added yet</p>
                      <p className="text-sm mt-1">Add your first book to start tracking sales and managing ads</p>
                      <Button variant="outline" className="mt-4" asChild>
                        <Link href="/books/new">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Book
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {books.map((book) => (
                    <Link key={book.id} href={`/books/${book.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <div className="flex">
                          {book.coverImage ? (
                            <img
                              src={book.coverImage}
                              alt={book.title}
                              className="w-24 h-36 object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-24 h-36 bg-muted flex items-center justify-center flex-shrink-0">
                              <BookOpen className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <CardContent className="p-4 flex flex-col flex-1">
                            <h3 className="font-semibold line-clamp-2">{book.title}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{book.author}</p>
                            <p className="text-xs text-muted-foreground mb-auto">
                              {book.brand.name}
                            </p>
                            <div className="flex items-center gap-3 mt-3 text-xs">
                              <span className="flex items-center gap-1">
                                <ShoppingCart className="h-3 w-3" />
                                {book.metrics.totalSales}
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${book.metrics.totalRevenue.toLocaleString()}
                              </span>
                              {book.metrics.avgRating && (
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  {book.metrics.avgRating.toFixed(1)}
                                </span>
                              )}
                            </div>
                            {book.amazonUrl && (
                              <div className="mt-2">
                                <span className="text-xs text-blue-600 flex items-center gap-1">
                                  <ExternalLink className="h-3 w-3" />
                                  Amazon
                                </span>
                              </div>
                            )}
                          </CardContent>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Campaigns Tab - Empty */}
            <TabsContent value="campaigns" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Amazon Ads & Marketing Campaigns</CardTitle>
                  <CardDescription>Manage your book advertising across platforms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Megaphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No campaigns yet</p>
                    <p className="text-sm mt-1">Add a book first, then create ad campaigns</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Launches Tab - Empty */}
            <TabsContent value="launches" className="space-y-6 mt-6">
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No launch plans yet</p>
                    <p className="text-sm mt-1">Create a launch plan for your upcoming book release</p>
                    <Button variant="outline" className="mt-4" disabled>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Launch Plan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reviews Tab - Empty */}
            <TabsContent value="reviews" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Management</CardTitle>
                  <CardDescription>Monitor and respond to reviews across all platforms</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No reviews yet</p>
                    <p className="text-sm mt-1">Reviews will appear here once your books are published</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
