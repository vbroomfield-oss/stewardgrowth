'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  BookOpen,
  Upload,
  Calendar,
  DollarSign,
  Tag,
  Link2,
  Save,
  Search,
  Loader2,
  CheckCircle,
} from 'lucide-react'

export default function NewBookPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [lookupSuccess, setLookupSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    author: '',
    isbn: '',
    description: '',
    category: '',
    publishDate: '',
    price: '',
    amazonUrl: '',
    kindleUrl: '',
    audibleUrl: '',
    coverUrl: '',
    publisher: '',
    pageCount: '',
  })

  // ISBN Lookup using Open Library API
  const handleISBNLookup = async () => {
    const isbn = formData.isbn.replace(/[-\s]/g, '')
    if (!isbn || isbn.length < 10) {
      alert('Please enter a valid ISBN (10 or 13 digits)')
      return
    }

    setIsLookingUp(true)
    setLookupSuccess(false)

    try {
      // Try Open Library API
      const response = await fetch(
        `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
      )
      const data = await response.json()
      const bookData = data[`ISBN:${isbn}`]

      if (bookData) {
        setFormData((prev) => ({
          ...prev,
          title: bookData.title || prev.title,
          subtitle: bookData.subtitle || prev.subtitle,
          author: bookData.authors?.[0]?.name || prev.author,
          description: bookData.notes || bookData.excerpts?.[0]?.text || prev.description,
          publisher: bookData.publishers?.[0]?.name || prev.publisher,
          publishDate: bookData.publish_date || prev.publishDate,
          pageCount: bookData.number_of_pages?.toString() || prev.pageCount,
          coverUrl: bookData.cover?.large || bookData.cover?.medium || prev.coverUrl,
          // Auto-generate Amazon URL
          amazonUrl: `https://amazon.com/dp/${isbn}`,
        }))
        setLookupSuccess(true)
      } else {
        // Try Google Books API as fallback
        const googleResponse = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        )
        const googleData = await googleResponse.json()
        const googleBook = googleData.items?.[0]?.volumeInfo

        if (googleBook) {
          setFormData((prev) => ({
            ...prev,
            title: googleBook.title || prev.title,
            subtitle: googleBook.subtitle || prev.subtitle,
            author: googleBook.authors?.join(', ') || prev.author,
            description: googleBook.description || prev.description,
            publisher: googleBook.publisher || prev.publisher,
            publishDate: googleBook.publishedDate || prev.publishDate,
            pageCount: googleBook.pageCount?.toString() || prev.pageCount,
            coverUrl: googleBook.imageLinks?.thumbnail?.replace('http:', 'https:') || prev.coverUrl,
            amazonUrl: `https://amazon.com/dp/${isbn}`,
          }))
          setLookupSuccess(true)
        } else {
          alert('Book not found. Please enter details manually.')
        }
      }
    } catch (error) {
      console.error('ISBN lookup error:', error)
      alert('Error looking up ISBN. Please enter details manually.')
    } finally {
      setIsLookingUp(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setIsLoading(false)
    router.push('/books')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/books">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Book</h1>
          <p className="text-muted-foreground">
            Add a book to start tracking sales and running ad campaigns
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Details
            </CardTitle>
            <CardDescription>Basic information about your book</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <Input
                  placeholder="Enter book title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-2 block">Subtitle</label>
                <Input
                  placeholder="Enter subtitle (optional)"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Author *</label>
                <Input
                  placeholder="Author name"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">ISBN</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="978-X-XXXXXX-XX-X"
                    value={formData.isbn}
                    onChange={(e) => {
                      setFormData({ ...formData, isbn: e.target.value })
                      setLookupSuccess(false)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleISBNLookup}
                    disabled={isLookingUp || !formData.isbn}
                  >
                    {isLookingUp ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : lookupSuccess ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter ISBN and click search to auto-fill book details
                </p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Book description for marketing materials..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cover Image */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Book Cover
            </CardTitle>
            <CardDescription>Upload your book cover for ad creatives</CardDescription>
          </CardHeader>
          <CardContent>
            {formData.coverUrl ? (
              <div className="flex gap-6">
                <div className="w-32">
                  <img
                    src={formData.coverUrl}
                    alt="Book cover"
                    className="w-full rounded-lg shadow-md"
                  />
                  <p className="text-xs text-green-600 mt-2 text-center">
                    Cover loaded from ISBN
                  </p>
                </div>
                <div className="flex-1 border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload a different cover image
                  </p>
                  <Button variant="outline" size="sm">
                    Replace Cover
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-lg bg-muted flex items-center justify-center mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Drag and drop your cover image, or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Tip: Enter ISBN above to auto-load cover image
                </p>
                <Button variant="outline" className="mt-4">
                  Upload Cover
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Publishing Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Publishing Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Category</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="christian-living">Christian Living</option>
                  <option value="christian-leadership">Christian Leadership</option>
                  <option value="church-ministry">Church & Ministry</option>
                  <option value="business">Business</option>
                  <option value="self-help">Self Help</option>
                  <option value="technology">Technology</option>
                  <option value="fiction">Fiction</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Publish Date</label>
                <Input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => setFormData({ ...formData, publishDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Price ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="14.99"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Links */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="h-5 w-5" />
              Platform Links
            </CardTitle>
            <CardDescription>
              Add links to your book on various platforms for tracking and ads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Amazon URL</label>
              <Input
                placeholder="https://amazon.com/dp/XXXXXXXXXX"
                value={formData.amazonUrl}
                onChange={(e) => setFormData({ ...formData, amazonUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Kindle URL</label>
              <Input
                placeholder="https://amazon.com/dp/XXXXXXXXXX"
                value={formData.kindleUrl}
                onChange={(e) => setFormData({ ...formData, kindleUrl: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Audible URL</label>
              <Input
                placeholder="https://audible.com/pd/XXXXXXXXXX"
                value={formData.audibleUrl}
                onChange={(e) => setFormData({ ...formData, audibleUrl: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/books">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? 'Saving...' : 'Save Book'}
          </Button>
        </div>
      </form>
    </div>
  )
}
