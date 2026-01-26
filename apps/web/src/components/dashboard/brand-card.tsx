import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn, formatCurrency, formatNumber } from '@/lib/utils'
import { TrendingUp, TrendingDown, ExternalLink, Eye } from 'lucide-react'

interface BrandCardProps {
  brand: {
    id: string
    name: string
    slug: string
    logo?: string
    domain?: string
    color?: string
    metrics: {
      mrr: number
      mrrChange: number
      leads: number
      leadsChange: number
      trials: number
      adSpend: number
    }
  }
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Card className="card-hover overflow-hidden">
      {/* Colored top border */}
      <div
        className="h-1"
        style={{ backgroundColor: brand.color || '#6366f1' }}
      />

      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: brand.color || '#6366f1' }}
            >
              {brand.name[0]}
            </div>
            <div>
              <h3 className="font-semibold">{brand.name}</h3>
              {brand.domain && (
                <a
                  href={`https://${brand.domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                >
                  {brand.domain}
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">MRR</p>
            <p className="text-lg font-semibold">{formatCurrency(brand.metrics.mrr)}</p>
            <div className="flex items-center gap-1">
              {brand.metrics.mrrChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs',
                  brand.metrics.mrrChange >= 0 ? 'text-green-500' : 'text-red-500'
                )}
              >
                {brand.metrics.mrrChange >= 0 && '+'}
                {brand.metrics.mrrChange}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Leads</p>
            <p className="text-lg font-semibold">{formatNumber(brand.metrics.leads)}</p>
            <div className="flex items-center gap-1">
              {brand.metrics.leadsChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span
                className={cn(
                  'text-xs',
                  brand.metrics.leadsChange >= 0 ? 'text-green-500' : 'text-red-500'
                )}
              >
                {brand.metrics.leadsChange >= 0 && '+'}
                {brand.metrics.leadsChange}%
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Trials</p>
            <p className="text-lg font-semibold">{formatNumber(brand.metrics.trials)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ad Spend</p>
            <p className="text-lg font-semibold">{formatCurrency(brand.metrics.adSpend)}</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t">
          <Button variant="default" size="sm" className="w-full" asChild>
            <Link href={`/brands/${brand.slug}`}>
              <Eye className="mr-2 h-4 w-4" />
              View Dashboard
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
