'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  Sparkles,
  Plus,
  Loader2,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
}

export default function WeeklyPlansPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands')
        if (res.ok) {
          const data = await res.json()
          setBrands(data.brands || [])
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Calendar className="h-8 w-8 text-indigo-500" />
            Weekly Marketing Plans
          </h1>
          <p className="text-muted-foreground">
            AI-generated weekly action plans
          </p>
        </div>
        <Button disabled>
          <Sparkles className="mr-2 h-4 w-4" />
          Generate New Plan
        </Button>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-indigo-500/10 p-4 mb-4">
              <Calendar className="h-8 w-8 text-indigo-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start generating AI-powered weekly marketing plans with tasks across SEO, Content, and Ads.
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
          {/* Current Week - Empty */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>This Week</CardTitle>
                  <CardDescription>
                    No plan generated for this week yet
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No weekly plan yet</p>
                <p className="text-sm mt-1">
                  Generate an AI-powered weekly marketing plan for your brands
                </p>
                <Button variant="outline" className="mt-4" disabled>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Plan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Plans - Empty */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Plans</CardTitle>
              <CardDescription>AI-generated plans for future weeks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No upcoming plans scheduled</p>
                <p className="text-sm mt-1">
                  Future plans will appear here as they are generated
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
