'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, FileText, Clock, CheckCircle2 } from 'lucide-react'

interface PortalBrandCardProps {
  brand: {
    id: string
    name: string
    slug: string
    logo: string | null
    color?: string
    connectedPlatforms: string[]
    stats: {
      publishedPosts: number
      scheduledPosts: number
      pendingApprovals: number
    }
  }
}

export function PortalBrandCard({ brand }: PortalBrandCardProps) {
  const initial = brand.name[0]?.toUpperCase() || '?'

  return (
    <Link href={`/portal/${brand.slug}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: brand.color || '#6366f1' }}
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base truncate">{brand.name}</CardTitle>
              <div className="flex gap-1 mt-1 flex-wrap">
                {brand.connectedPlatforms.slice(0, 4).map(p => (
                  <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {p}
                  </Badge>
                ))}
                {brand.connectedPlatforms.length > 4 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    +{brand.connectedPlatforms.length - 4}
                  </Badge>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="text-lg font-semibold">{brand.stats.publishedPosts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-blue-600 dark:text-blue-400">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-lg font-semibold">{brand.stats.scheduledPosts}</span>
              </div>
              <p className="text-xs text-muted-foreground">Scheduled</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400">
                <FileText className="h-3.5 w-3.5" />
                <span className="text-lg font-semibold">{brand.stats.pendingApprovals}</span>
              </div>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
