'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReadinessChecklist, defaultReadinessItems, type ReadinessItem } from '@/components/brands/readiness-checklist'
import { ArrowLeft, Rocket, Loader2 } from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  domain: string | null
  logo: string | null
  brandVoice: any
  targetAudiences: any
  budgetConstraints: any
  settings: any
}

function calculateReadinessStatus(brand: Brand): ReadinessItem[] {
  const settings = brand.settings || {}
  const brandVoice = brand.brandVoice || {}
  const budgetConstraints = brand.budgetConstraints || {}
  const targetAudiences = brand.targetAudiences || []
  const tracking = settings.tracking || {}

  return defaultReadinessItems.map((item) => {
    let status: 'complete' | 'incomplete' | 'warning' = 'incomplete'

    switch (item.id) {
      // Website category
      case 'website-live':
        status = brand.domain ? 'complete' : 'incomplete'
        break

      case 'landing-page-approved':
        // Would check for approved landing page
        status = brand.domain ? 'complete' : 'incomplete'
        break

      case 'pricing-page':
        // Would check if pricing page exists
        status = 'incomplete'
        break

      case 'ssl-configured':
        // Assume SSL if domain is configured
        status = brand.domain ? 'complete' : 'incomplete'
        break

      // Content category
      case 'brand-voice':
        status = brandVoice.tone || brandVoice.keywords?.length > 0 ? 'complete' : 'incomplete'
        break

      case 'sample-content':
        // Would check for approved sample content
        status = 'incomplete'
        break

      // Integrations category
      case 'analytics-connected':
        status = tracking.trackingId ? 'complete' : 'incomplete'
        break

      case 'google-ads-connected':
        // Would check for Google Ads connection
        status = 'incomplete'
        break

      case 'meta-ads-connected':
        // Would check for Meta Ads connection
        status = 'incomplete'
        break

      // Payments category
      case 'payment-processing':
        // Would check for payment setup
        status = 'incomplete'
        break

      case 'subscription-plans':
        // Would check for subscription plan setup
        status = 'incomplete'
        break

      // Legal category
      case 'privacy-policy':
        // Would check for privacy policy
        status = 'incomplete'
        break

      case 'terms-of-service':
        // Would check for terms of service
        status = 'incomplete'
        break

      case 'cookie-consent':
        // Would check for cookie consent
        status = 'incomplete'
        break

      // Advertising category
      case 'ad-budget-set':
        status = budgetConstraints.monthly > 0 ? 'complete' : 'incomplete'
        break

      case 'conversion-tracking':
        status = tracking.trackingId ? 'complete' : 'incomplete'
        break

      // Targeting category
      case 'target-audience':
        status = targetAudiences.length > 0 ? 'complete' : 'incomplete'
        break

      case 'goals-set':
        // Would check for marketing goals
        status = 'incomplete'
        break

      // Branding category
      case 'logo-uploaded':
        status = brand.logo ? 'complete' : 'incomplete'
        break

      case 'brand-colors':
        status = settings.color ? 'complete' : 'incomplete'
        break

      // Support category
      case 'support-email':
        // Would check for support email
        status = 'incomplete'
        break

      default:
        status = 'incomplete'
    }

    return { ...item, status }
  })
}

export default function BrandReadinessPage({ params }: { params: { slug: string } }) {
  const [brand, setBrand] = useState<Brand | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBrand() {
      try {
        const res = await fetch(`/api/brands/${params.slug}`, { credentials: 'include' })
        if (!res.ok) throw new Error('Failed to load brand')
        const data = await res.json()
        if (!data.success) throw new Error(data.error || 'Failed to load brand')
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

  const readinessItems = calculateReadinessStatus(brand)
  const isReady = readinessItems.every((i) => i.status === 'complete')
  const completedCount = readinessItems.filter((i) => i.status === 'complete').length

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
            <h1 className="text-3xl font-bold tracking-tight">Market Readiness</h1>
            <p className="text-muted-foreground">
              Complete these requirements before launching marketing for {brand.name}
            </p>
          </div>
        </div>
        {isReady ? (
          <Button className="bg-success hover:bg-success/90">
            <Rocket className="mr-2 h-4 w-4" />
            Launch Marketing
          </Button>
        ) : (
          <div className="text-sm text-muted-foreground">
            {completedCount} of {readinessItems.length} complete
          </div>
        )}
      </div>

      <ReadinessChecklist
        brandName={brand.name}
        items={readinessItems}
        onItemClick={(itemId) => {
          // Navigate to relevant settings section
          switch (itemId) {
            case 'website-live':
            case 'landing-page-approved':
            case 'ssl-configured':
            case 'brand-voice':
            case 'logo-uploaded':
            case 'brand-colors':
            case 'target-audience':
              window.location.href = `/brands/${params.slug}/settings`
              break
            case 'analytics-connected':
            case 'conversion-tracking':
              window.location.href = `/brands/${params.slug}/settings#tracking`
              break
            case 'ad-budget-set':
              window.location.href = `/brands/${params.slug}/funding`
              break
            case 'google-ads-connected':
            case 'meta-ads-connected':
              window.location.href = `/brands/${params.slug}/settings#integrations`
              break
            default:
              console.log('Clicked:', itemId)
          }
        }}
      />
    </div>
  )
}
