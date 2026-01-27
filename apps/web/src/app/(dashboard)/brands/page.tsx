'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Plus,
  Search,
  Building2,
  ExternalLink,
  Settings,
  BarChart3,
  Loader2,
  AlertCircle,
  Code,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
  domain: string | null
  color: string
  isActive: boolean
  createdAt: string
  eventsCount: number
  contentCount: number
  campaignsCount: number
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchBrands()
  }, [])

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands')
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch brands')
      }

      setBrands(result.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.slug.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchBrands}>
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Brands</h1>
          <p className="text-muted-foreground">
            Manage your SaaS products and their marketing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {brands.length > 0 && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                className="pl-9 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
          <Button asChild>
            <Link href="/brands/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Brand
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      {brands.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{brands.length}</p>
                  <p className="text-sm text-muted-foreground">Total Brands</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {brands.reduce((sum, b) => sum + b.eventsCount, 0).toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Events</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Code className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {brands.reduce((sum, b) => sum + b.contentCount, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Content Posts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {brands.reduce((sum, b) => sum + b.campaignsCount, 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Campaigns</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Brands Grid */}
      {filteredBrands.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            {brands.length === 0 ? (
              <>
                <h3 className="text-lg font-medium mb-2">No brands yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first SaaS product
                </p>
                <Button asChild>
                  <Link href="/brands/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Your First Brand
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium mb-2">No brands found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search query
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map((brand) => (
            <Link key={brand.id} href={`/brands/${brand.slug}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: brand.color }}
                      >
                        {brand.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{brand.name}</h3>
                        {brand.domain && (
                          <p className="text-xs text-muted-foreground">{brand.domain}</p>
                        )}
                      </div>
                    </div>
                    <span
                      className={cn(
                        'px-2 py-1 text-xs rounded-full',
                        brand.isActive
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {brand.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className="text-xl font-bold">{brand.eventsCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Events</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{brand.contentCount}</p>
                      <p className="text-xs text-muted-foreground">Content</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{brand.campaignsCount}</p>
                      <p className="text-xs text-muted-foreground">Campaigns</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button variant="ghost" size="sm" className="flex-1" asChild onClick={(e) => e.stopPropagation()}>
                      <Link href={`/brands/${brand.slug}`}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" className="flex-1" asChild onClick={(e) => e.stopPropagation()}>
                      <Link href={`/brands/${brand.slug}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    {brand.domain && (
                      <Button variant="ghost" size="icon" asChild onClick={(e) => e.stopPropagation()}>
                        <a href={`https://${brand.domain}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
