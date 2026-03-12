'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Calendar,
  Plus,
  Twitter,
  Mail,
  Target,
  Loader2,
  Sparkles,
  Linkedin,
  Facebook,
  Instagram,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
}

interface ContentPost {
  id: string
  title: string | null
  content: string
  platforms: string[]
  status: string
  aiGenerated: boolean
  createdAt: string
  scheduledFor: string | null
  publishedAt: string | null
  brand: { id: string; name: string; slug: string }
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: FileText },
  AWAITING_APPROVAL: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  APPROVED: { label: 'Approved', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  PUBLISHED: { label: 'Published', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
}

const platformIcons: Record<string, typeof Twitter> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
  email: Mail,
  blog: FileText,
}

export default function ContentPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [content, setContent] = useState<ContentPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filterBrand, setFilterBrand] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  useEffect(() => {
    async function fetchData() {
      try {
        const [brandsRes, contentRes] = await Promise.all([
          fetch('/api/brands', { credentials: 'include' }),
          fetch('/api/content/save', { credentials: 'include' }),
        ])

        if (brandsRes.ok) {
          const data = await brandsRes.json()
          setBrands(data.brands || [])
        }

        if (contentRes.ok) {
          const data = await contentRes.json()
          setContent(data.data || [])
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

  const filteredContent = content.filter((c) => {
    if (filterBrand !== 'all' && c.brand.id !== filterBrand) return false
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    return true
  })

  const stats = {
    total: content.length,
    pending: content.filter((c) => c.status === 'AWAITING_APPROVAL').length,
    scheduled: content.filter((c) => c.status === 'APPROVED' && c.scheduledFor).length,
    published: content.filter((c) => c.status === 'PUBLISHED').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Hub</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage all your marketing content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/ai/plans">
              <Calendar className="mr-2 h-4 w-4" />
              Weekly Plans
            </Link>
          </Button>
          <Button asChild>
            <Link href="/content/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start creating AI-powered content for blogs, social media, and email campaigns.
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
          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-sm text-muted-foreground">Total Content</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <Sparkles className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.pending}</p>
                    <p className="text-sm text-muted-foreground">Pending Approval</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.scheduled}</p>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <Target className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.published}</p>
                    <p className="text-sm text-muted-foreground">Published</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="AWAITING_APPROVAL">Pending Approval</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Library */}
          <Card>
            <CardHeader>
              <CardTitle>Content Library</CardTitle>
              <CardDescription>
                {filteredContent.length} item{filteredContent.length !== 1 ? 's' : ''}
                {filterBrand !== 'all' || filterStatus !== 'all' ? ' (filtered)' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredContent.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{content.length === 0 ? 'No content created yet' : 'No content matches filters'}</p>
                  <p className="text-sm mt-1">
                    {content.length === 0 ? 'Create your first piece of content to get started' : 'Try adjusting your filters'}
                  </p>
                  {content.length === 0 && (
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/content/create">Create Content</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredContent.map((item) => {
                    const status = statusConfig[item.status] || statusConfig.DRAFT
                    const StatusIcon = status.icon
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        {/* Status icon */}
                        <StatusIcon className="h-4 w-4 text-muted-foreground shrink-0" />

                        {/* Content info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {item.title || item.content.substring(0, 60) + '...'}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{item.brand.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        {/* Platforms */}
                        <div className="flex items-center gap-1 shrink-0">
                          {(item.platforms || []).slice(0, 3).map((p) => {
                            const Icon = platformIcons[p] || FileText
                            return <Icon key={p} className="h-3.5 w-3.5 text-muted-foreground" />
                          })}
                        </div>

                        {/* Status badge */}
                        <span className={cn('text-xs px-2 py-0.5 rounded-full shrink-0', status.color)}>
                          {status.label}
                        </span>

                        {/* AI badge */}
                        {item.aiGenerated && (
                          <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                        )}

                        {/* View in approvals if pending */}
                        {item.status === 'AWAITING_APPROVAL' && (
                          <Button variant="ghost" size="sm" className="shrink-0" asChild>
                            <Link href="/approvals">
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/content/create?type=blog">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Write Blog Post</p>
                <p className="text-sm text-gray-500">AI-assisted writing</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/create?type=social">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Twitter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Social Post</p>
                <p className="text-sm text-gray-500">Multi-platform</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/create?type=email">
          <Card className="hover:border-green-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Email Campaign</p>
                <p className="text-sm text-gray-500">Newsletter & nurture</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/create?type=ad">
          <Card className="hover:border-orange-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium">Ad Copy</p>
                <p className="text-sm text-gray-500">Google, Meta, LinkedIn</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
