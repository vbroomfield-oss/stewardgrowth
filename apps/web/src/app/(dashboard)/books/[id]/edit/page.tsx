'use client'

import { useState, useEffect, useRef, use } from 'react'
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
  Loader2,
  AlertCircle,
  X,
  ImageIcon,
} from 'lucide-react'

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
  }
}

export default function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [formData, setFormData] = useState({
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
  const [brandName, setBrandName] = useState('')

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await fetch(`/api/books/${resolvedParams.id}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load book')
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load book')

        const book: Book = data.book
        setBrandName(book.brand.name)
        setCoverPreview(book.coverImage)
        setFormData({
          title: book.title || '',
          subtitle: book.subtitle || '',
          author: book.author || '',
          isbn: book.isbn || '',
          asin: book.asin || '',
          description: book.description || '',
          category: book.category || '',
          publishDate: book.publishDate ? book.publishDate.split('T')[0] : '',
          price: book.price?.toString() || '',
          amazonUrl: book.amazonUrl || '',
          kindleUrl: book.kindleUrl || '',
          audibleUrl: book.audibleUrl || '',
          barnesNobleUrl: book.barnesNobleUrl || '',
          coverImage: book.coverImage || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book')
      } finally {
        setLoading(false)
      }
    }
    fetchBook()
  }, [resolvedParams.id])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setCoverPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

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
      setCoverPreview(formData.coverImage || null)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/books/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
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
        throw new Error(data.error || 'Failed to update book')
      }

      router.push(`/books/${resolvedParams.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update book')
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/books/${resolvedParams.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>
          <p className="text-muted-foreground">
            Update details for {formData.title || 'your book'}
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
        {/* Brand (read-only) */}
        <Card>
          <CardHeader>
            <CardTitle>Brand</CardTitle>
          </CardHeader>
          <CardContent>
            <Input value={brandName} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground mt-1">
              Brand cannot be changed after creation
            </p>
          </CardContent>
        </Card>

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Book Details
            </CardTitle>
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
                <Input
                  placeholder="978-X-XXXXXX-XX-X"
                  value={formData.isbn}
                  onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">ASIN</label>
                <Input
                  placeholder="Amazon ASIN"
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
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileUpload}
              className="hidden"
            />

            {coverPreview || formData.coverImage ? (
              <div className="flex items-start gap-6">
                <div className="relative">
                  <img
                    src={coverPreview || formData.coverImage}
                    alt="Book cover preview"
                    className="w-32 h-48 object-cover rounded-lg shadow-md"
                  />
                  <button
                    type="button"
                    onClick={removeCover}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Replace Cover
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="font-medium">Click to upload book cover</p>
                <p className="text-sm text-muted-foreground">JPEG, PNG, WebP, or GIF (max 5MB)</p>
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
            <Link href={`/books/${resolvedParams.id}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading || isUploading || !formData.title || !formData.author}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
