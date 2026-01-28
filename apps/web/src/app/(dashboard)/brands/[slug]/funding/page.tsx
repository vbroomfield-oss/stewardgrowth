'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { FundingDashboard } from '@/components/brands/funding-dashboard'
import { ArrowLeft, Settings, Loader2 } from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  budgetConstraints: {
    monthly: number
    dailyMax: number
    platforms: {
      google: number
      meta: number
      linkedin: number
    }
  }
}

interface Funding {
  balance: number
  monthlyBudget: number
  spent: number
  reserved: number
  autoFundEnabled: boolean
  autoFundAmount: number
  autoFundThreshold: number
  lastFundedAt?: string
  nextFundingDue?: string
  status: 'funded' | 'low' | 'depleted' | 'paused'
}

export default function BrandFundingPage({ params }: { params: { slug: string } }) {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBrand() {
      try {
        const res = await fetch(`/api/brands/${params.slug}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load brand')
        const data = await res.json()
        setBrand(data.brand)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load brand')
      } finally {
        setLoading(false)
      }
    }
    fetchBrand()
  }, [params.slug])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !brand) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-muted-foreground mb-4">{error || 'Brand not found'}</p>
        <Button asChild>
          <Link href="/brands">Back to Brands</Link>
        </Button>
      </div>
    )
  }

  // Build funding data from brand's budget constraints
  const monthlyBudget = brand.budgetConstraints?.monthly || 0
  const funding: Funding = {
    balance: monthlyBudget, // Start with full budget (no spending tracked yet)
    monthlyBudget,
    spent: 0, // TODO: Calculate from actual ad spend
    reserved: 0, // TODO: Calculate from pending campaigns
    autoFundEnabled: false,
    autoFundAmount: Math.round(monthlyBudget / 2),
    autoFundThreshold: Math.round(monthlyBudget * 0.2),
    lastFundedAt: undefined,
    nextFundingDue: undefined,
    status: monthlyBudget > 0 ? 'funded' : 'depleted',
  }

  // No transactions yet - will be populated when ad integrations are connected
  const recentTransactions: Array<{
    id: string
    type: 'spend' | 'deposit' | 'refund' | 'reserved'
    amount: number
    description: string
    platform?: string
    timestamp: string
  }> = []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/brands/${params.slug}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketing Funds</h1>
            <p className="text-muted-foreground">
              Manage marketing budget for {brand.name}
            </p>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/brands/${params.slug}/funding/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Budget Settings
          </Link>
        </Button>
      </div>

      <FundingDashboard
        brand={brand}
        funding={funding}
        recentTransactions={recentTransactions}
      />
    </div>
  )
}
