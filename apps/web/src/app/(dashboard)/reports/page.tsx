'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  FileText,
  Download,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Plus,
  Clock,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
}

const reportTemplates = [
  { name: 'Executive Summary', description: 'High-level overview of all marketing metrics', icon: BarChart3, color: 'blue' },
  { name: 'Lead Generation', description: 'Detailed lead sources and conversion paths', icon: Users, color: 'green' },
  { name: 'Revenue Attribution', description: 'Which channels drive the most revenue', icon: DollarSign, color: 'purple' },
  { name: 'Ad Performance', description: 'Campaign performance across all platforms', icon: Target, color: 'orange' },
  { name: 'SEO Progress', description: 'Ranking improvements and organic traffic', icon: TrendingUp, color: 'teal' },
  { name: 'Content Performance', description: 'Engagement metrics for published content', icon: FileText, color: 'pink' },
]

export default function ReportsPage() {
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
            <BarChart3 className="h-8 w-8 text-blue-500" />
            Reports
          </h1>
          <p className="text-muted-foreground">
            Generate and schedule marketing reports
          </p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      </div>

      {/* Empty State */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-blue-500/10 p-4 mb-4">
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to start generating marketing reports and scheduling automated report delivery.
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
          {/* Report Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template) => (
                <Card key={template.name} className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg',
                        template.color === 'blue' && 'bg-blue-100 dark:bg-blue-900/20',
                        template.color === 'green' && 'bg-green-100 dark:bg-green-900/20',
                        template.color === 'purple' && 'bg-purple-100 dark:bg-purple-900/20',
                        template.color === 'orange' && 'bg-orange-100 dark:bg-orange-900/20',
                        template.color === 'teal' && 'bg-teal-100 dark:bg-teal-900/20',
                        template.color === 'pink' && 'bg-pink-100 dark:bg-pink-900/20',
                      )}>
                        <template.icon className={cn(
                          'h-5 w-5',
                          template.color === 'blue' && 'text-blue-600',
                          template.color === 'green' && 'text-green-600',
                          template.color === 'purple' && 'text-purple-600',
                          template.color === 'orange' && 'text-orange-600',
                          template.color === 'teal' && 'text-teal-600',
                          template.color === 'pink' && 'text-pink-600',
                        )} />
                      </div>
                      <div>
                        <p className="font-medium">{template.name}</p>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Reports - Empty */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Reports</CardTitle>
                <CardDescription>Previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No reports generated yet</p>
                  <p className="text-sm mt-1">Select a template above to create your first report</p>
                </div>
              </CardContent>
            </Card>

            {/* Scheduled Reports - Empty */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Scheduled Reports</CardTitle>
                    <CardDescription>Automated recurring reports</CardDescription>
                  </div>
                  <Button size="sm" variant="outline" disabled>
                    <Plus className="mr-2 h-3 w-3" />
                    Schedule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled reports</p>
                  <p className="text-sm mt-1">Set up automated reports to receive them regularly</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
