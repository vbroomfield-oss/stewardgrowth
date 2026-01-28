'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  DollarSign,
  Users,
  Target,
  Percent,
  Calendar,
  Download,
  Plus,
  Loader2,
} from 'lucide-react'

interface Brand {
  id: string
  name: string
  slug: string
  color: string
}

export default function KPIsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands', { credentials: 'include' })
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
            <LineChart className="h-8 w-8 text-blue-500" />
            Key Performance Indicators
          </h1>
          <p className="text-muted-foreground">
            Track your most important marketing metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled>
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm" disabled>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <LineChart className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand and install tracking to start monitoring KPIs like MRR, leads, and conversion rates.
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
          {/* KPI Cards - Empty */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground mt-1">Monthly Recurring Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">0</p>
                <p className="text-sm text-muted-foreground mt-1">Total Leads</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">0%</p>
                <p className="text-sm text-muted-foreground mt-1">Conversion Rate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Target className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground mt-1">Customer Acquisition Cost</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">$0</p>
                <p className="text-sm text-muted-foreground mt-1">Lifetime Value</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Percent className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <p className="text-3xl font-bold">0%</p>
                <p className="text-sm text-muted-foreground mt-1">Churn Rate</p>
              </CardContent>
            </Card>
          </div>

          {/* Brand Comparison - Empty */}
          <Card>
            <CardHeader>
              <CardTitle>Brand Comparison</CardTitle>
              <CardDescription>KPIs broken down by brand</CardDescription>
            </CardHeader>
            <CardContent>
              {brands.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Brand</th>
                        <th className="text-right py-3 px-4 font-medium">MRR</th>
                        <th className="text-right py-3 px-4 font-medium">Leads</th>
                        <th className="text-right py-3 px-4 font-medium">Conversion</th>
                        <th className="text-right py-3 px-4 font-medium">CAC</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brands.map((brand) => (
                        <tr key={brand.id} className="border-b last:border-0">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brand.color || '#6366f1' }} />
                              <span className="font-medium">{brand.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-4 font-semibold">$0</td>
                          <td className="text-right py-3 px-4">0</td>
                          <td className="text-right py-3 px-4">0%</td>
                          <td className="text-right py-3 px-4">$0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No brands to compare</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
