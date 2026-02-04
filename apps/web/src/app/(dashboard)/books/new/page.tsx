'use client'

import { useState, useEffect, useRef } from 'react'
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
  Link2,
  Save,
  Search,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  ImageIcon,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
}

export default function NewBookPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [lookupSuccess, setLookupSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    brandId: '',
    title: '',
    subtitle: '',
    author: '',
    isbn: '',
    asin: '',
    description: '',
    category: '',
    publishDate: '',
    price: '',
    amazonUrl: '',
    kindleUrl: '',
    audibleUrl: '',
    barnesNobleUrl: '',
    coverImage: '',
  })

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const fetchedBrands = data.brands || []
          setBrands(fetchedBrands)
          if (fetchedBrands.length > 0) {
            setFormData(prev => ({ ...prev, brandId: fetchedBrands[0].id }))
          }
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      } finally {
        setLoadingBrands(false)
      }
    }
    fetchBrands()
  }, [])

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    setIsUploading(true)
    setError(null)

    try {
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('type', 'book-cover')

      const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include',
        body: uploadFormData,
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to upload image')
      }

      setFormData(prev => ({ ...prev, coverImage: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image')
      setCoverPreview(null)
    } finally {
      setIsUploading(false)
    }
  }

  const removeCover = () => {
    setFormData(prev => ({ ...prev, coverImage: '' }))
    setCoverPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

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
        const coverUrl = bookData.cover?.large || bookData.cover?.medium || ''
        setFormData((prev) => ({
          ...prev,
          title: bookData.title || prev.title,
          subtitle: bookData.subtitle || prev.subtitle,
          author: bookData.authors?.[0]?.name || prev.author,
          description: bookData.notes || bookData.excerpts?.[0]?.text || prev.description,
          publishDate: bookData.publish_date || prev.publishDate,
          coverImage: coverUrl || prev.coverImage,
          amazonUrl: `https://amazon.com/dp/${isbn}`,
        }))
        if (coverUrl) setCoverPreview(coverUrl)
        setLookupSuccess(true)
      } else {
        // Try Google Books API as fallback
        const googleResponse = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`
        )
        const googleData = await googleResponse.json()
        const googleBook = googleData.items?.[0]?.volumeInfo

        if (googleBook) {
          const coverUrl = googleBook.imageLinks?.thumbnail?.replace('http:', 'https:') || ''
          setFormData((prev) => ({
            ...prev,
            title: googleBook.title || prev.title,
            subtitle: googleBook.subtitle || prev.subtitle,
            author: googleBook.authors?.join(', ') || prev.author,
            description: googleBook.description || prev.description,
            publishDate: googleBook.publishedDate || prev.publishDate,
            coverImage: coverUrl || prev.coverImage,
            amazonUrl: `https://amazon.com/dp/${isbn}`,
          }))
          if (coverUrl) setCoverPreview(coverUrl)
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
    setError(null)

    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          brandId: formData.brandId,
          title: formData.title,
          subtitle: formData.subtitle || null,
          author: formData.author,
          isbn: formData.isbn || null,
          asin: formData.asin || null,
          description: formData.description || null,
          category: formData.category || null,
          publishDate: formData.publishDate || null,
          price: formData.price || null,
          amazonUrl: formData.amazonUrl || null,
          kindleUrl: formData.kindleUrl || null,
          audibleUrl: formData.audibleUrl || null,
          barnesNobleUrl: formData.barnesNobleUrl || null,
          coverImage: formData.coverImage || null,
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create book')
      }

      router.push('/books')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create book')
    } finally {
      setIsLoading(false)
    }
  }

  if (loadingBrands) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="space-y-6 max-w-4xl">
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

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              You need to create a brand first before adding books. Books are associated with brands for marketing purposes.
            </p>
            <Button asChild size="lg">
              <Link href="/brands/new">Create a Brand First</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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

      {error && (
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Brand Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Brand</CardTitle>
            <CardDescription>Choose which brand this book belongs to</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={formData.brandId}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
              required
            >
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>{brand.name}</option>
              ))}
            </select>
          </CardContent>
        </Card>

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
              <div>
                <label className="text-sm font-medium mb-2 block">ASIN</label>
                <Input
                  placeholder="Amazon ASIN (e.g., B0XXXXXXXXX)"
                  value={formData.asin}
                  onChange={(e) => setFormData({ ...formData, asin: e.target.value })}
                />
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
            <CardDescription>Add your book cover image (paste URL from Amazon - recommended)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="text-sm font-medium mb-2 block">Cover Image URL</label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://images-na.ssl-images-amazon.com/images/I/..."
                  value={formData.coverImage}
                  onChange={(e) => {
                    setFormData({ ...formData, coverImage: e.target.value })
                    setCoverPreview(e.target.value)
                  }}
                />
                {formData.coverImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={removeCover}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Go to Amazon, right-click your book cover, and select "Copy image address" then paste here
              </p>
            </div>

            {/* Preview */}
            {(coverPreview || formData.coverImage) && (
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <img
                  src={coverPreview || formData.coverImage}
                  alt="Book cover preview"
                  className="w-24 h-36 object-cover rounded-lg shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                <div>
                  <p className="text-sm text-green-600 font-medium">Preview loaded</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This image will be used for marketing materials
                  </p>
                </div>
              </div>
            )}

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or upload from device</span>
              </div>
            </div>

            {/* File Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Upload from Computer
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              JPEG, PNG, WebP, or GIF (max 5MB) - Requires storage setup
            </p>
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
            <div>
              <label className="text-sm font-medium mb-2 block">Barnes & Noble URL</label>
              <Input
                placeholder="https://barnesandnoble.com/..."
                value={formData.barnesNobleUrl}
                onChange={(e) => setFormData({ ...formData, barnesNobleUrl: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/books">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading || isUploading || !formData.title || !formData.author || !formData.brandId}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Book
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
