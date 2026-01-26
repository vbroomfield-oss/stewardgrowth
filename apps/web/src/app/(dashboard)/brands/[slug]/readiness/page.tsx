'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReadinessChecklist, defaultReadinessItems } from '@/components/brands/readiness-checklist'
import { ArrowLeft, Rocket } from 'lucide-react'

// Mock data - simulating a brand with some items complete
const mockReadinessItems = defaultReadinessItems.map((item, index) => ({
  ...item,
  status: index < 8 ? 'complete' as const : item.status,
}))

export default function BrandReadinessPage({ params }: { params: { slug: string } }) {
  const brandName = params.slug.charAt(0).toUpperCase() + params.slug.slice(1)
  const isReady = mockReadinessItems.every((i) => i.status === 'complete')

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
              Complete these requirements before launching marketing for {brandName}
            </p>
          </div>
        </div>
        {isReady && (
          <Button className="bg-success hover:bg-success/90">
            <Rocket className="mr-2 h-4 w-4" />
            Launch Marketing
          </Button>
        )}
      </div>

      <ReadinessChecklist
        brandName={brandName}
        items={mockReadinessItems}
        onItemClick={(itemId) => console.log('Clicked:', itemId)}
      />
    </div>
  )
}
