'use client'

import { useState, useEffect } from 'react'
import { PortalBrandCard } from '@/components/portal/portal-brand-card'
import { Skeleton } from '@/components/ui/skeleton'

interface Brand {
  id: string
  name: string
  slug: string
  logo: string | null
  color: string
  connectedPlatforms: string[]
  stats: {
    publishedPosts: number
    scheduledPosts: number
    pendingApprovals: number
    totalContent: number
  }
}

export default function PortalHomePage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [user, setUser] = useState<{ firstName: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [brandsRes, userRes] = await Promise.all([
          fetch('/api/portal/brands', { credentials: 'include' }),
          fetch('/api/user', { credentials: 'include' }),
        ])

        if (brandsRes.ok) {
          const data = await brandsRes.json()
          setBrands(data.brands || [])
        }
        if (userRes.ok) {
          const data = await userRes.json()
          setUser(data.user)
        }
      } catch (error) {
        console.error('Failed to load portal data:', error)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="text-muted-foreground mt-1">
          Monitor your brand performance and content activity.
        </p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-medium">No brands available</p>
          <p className="mt-1">Contact your marketing team to get access to brand monitoring.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map(brand => (
            <PortalBrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      )}
    </div>
  )
}
