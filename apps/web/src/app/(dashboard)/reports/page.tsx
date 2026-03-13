'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ---- Types ----

interface Brand {
  id: string
  name: string
  slug: string
}

interface ReportDataItem {
  label: string
  value: string
  change?: string
}

interface ReportSection {
  heading: string
  content: string
  data?: ReportDataItem[]
}

interface GeneratedReport {
  title: string
  type: string
  brandId: string
  brandName: string
  generatedAt: string
  dateRange: { start: string; end: string }
  sections: ReportSection[]
}

type ReportTypeKey =
  | 'executive_summary'
  | 'lead_generation'
  | 'revenue_attribution'
  | 'ad_performance'
  | 'seo_progress'
  | 'content_performance'

// ---- Template definitions ----

const reportTemplates: Array<{
  key: ReportTypeKey
  name: string
  description: string
  icon: typeof BarChart3
  color: string
}> = [
  { key: 'executive_summary', name: 'Executive Summary', description: 'High-level overview of all marketing metrics', icon: BarChart3, color: 'blue' },
  { key: 'lead_generation', name: 'Lead Generation', description: 'Detailed lead sources and conversion paths', icon: Users, color: 'green' },
  { key: 'revenue_attribution', name: 'Revenue Attribution', description: 'Which channels drive the most revenue', icon: DollarSign, color: 'purple' },
  { key: 'ad_performance', name: 'Ad Performance', description: 'Campaign performance across all platforms', icon: Target, color: 'orange' },
  { key: 'seo_progress', name: 'SEO Progress', description: 'Ranking improvements and organic traffic', icon: TrendingUp, color: 'teal' },
  { key: 'content_performance', name: 'Content Performance', description: 'Engagement metrics for published content', icon: FileText, color: 'pink' },
]

// ---- Helpers ----

/** Get the first day of the current month in YYYY-MM-DD */
function firstOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

/** Get today in YYYY-MM-DD */
function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---- Component ----

export default function ReportsPage() {
  // Data
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  // Report creation form state
  const [showForm, setShowForm] = useState(false)
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [selectedType, setSelectedType] = useState<ReportTypeKey | ''>('')
  const [startDate, setStartDate] = useState(firstOfMonth())
  const [endDate, setEndDate] = useState(today())

  // Generation state
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [generatedReport, setGeneratedReport] = useState<GeneratedReport | null>(null)

  // Export state
  const [exporting, setExporting] = useState(false)

  // ---- Fetch brands ----
  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const fetchedBrands = data.brands || []
          setBrands(fetchedBrands)
          if (fetchedBrands.length > 0) {
            setSelectedBrandId(fetchedBrands[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  // ---- Generate report ----
  const handleGenerate = useCallback(async () => {
    if (!selectedBrandId || !selectedType) return

    setGenerating(true)
    setGenerationError('')
    setGeneratedReport(null)

    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          brandId: selectedBrandId,
          type: selectedType,
          dateRange: { start: startDate, end: endDate },
        }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setGenerationError(data.error || 'Failed to generate report')
        return
      }

      setGeneratedReport(data.report)
    } catch (err) {
      console.error('Report generation failed:', err)
      setGenerationError('Network error. Please try again.')
    } finally {
      setGenerating(false)
    }
  }, [selectedBrandId, selectedType, startDate, endDate])

  // ---- Export CSV ----
  const handleExportCSV = useCallback(async () => {
    if (!generatedReport) return

    setExporting(true)
    try {
      const res = await fetch('/api/reports/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          report: generatedReport,
          format: 'csv',
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        console.error('Export failed:', errData)
        return
      }

      // Download the CSV file
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = generatedReport.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [generatedReport])

  // ---- Reset form ----
  const handleReset = useCallback(() => {
    setShowForm(false)
    setSelectedType('')
    setGeneratedReport(null)
    setGenerationError('')
  }, [])

  // ---- Clicking a template card selects the type and shows the form ----
  const handleTemplateClick = useCallback((key: ReportTypeKey) => {
    setSelectedType(key)
    setShowForm(true)
    setGeneratedReport(null)
    setGenerationError('')
  }, [])

  // ---- Loading state ----
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // ---- Render ----
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
        {generatedReport || showForm ? (
          <Button variant="outline" onClick={handleReset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Templates
          </Button>
        ) : (
          <Button
            onClick={() => setShowForm(true)}
            disabled={brands.length === 0}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Report
          </Button>
        )}
      </div>

      {/* Empty State — no brands */}
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
      ) : generatedReport ? (
        /* ---- Generated Report Display ---- */
        <div className="space-y-6">
          {/* Report Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">{generatedReport.title}</CardTitle>
                  <CardDescription>
                    {generatedReport.brandName} &middot;{' '}
                    {new Date(generatedReport.dateRange.start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {' '}&ndash;{' '}
                    {new Date(generatedReport.dateRange.end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {' '}&middot; Generated{' '}
                    {new Date(generatedReport.generatedAt).toLocaleString()}
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={handleExportCSV}
                  disabled={exporting}
                >
                  {exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Export CSV
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Report Sections */}
          {generatedReport.sections.map((section, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-lg">{section.heading}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Section narrative */}
                <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                  {section.content}
                </div>

                {/* Section data table */}
                {section.data && section.data.length > 0 && (
                  <div className="mt-4 border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left py-2 px-4 font-medium">Metric</th>
                          <th className="text-right py-2 px-4 font-medium">Value</th>
                          <th className="text-right py-2 px-4 font-medium">Change</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.data.map((item, i) => (
                          <tr key={i} className="border-b last:border-0">
                            <td className="py-2 px-4">{item.label}</td>
                            <td className="py-2 px-4 text-right font-mono">{item.value}</td>
                            <td className="py-2 px-4 text-right">
                              {item.change && (
                                <span
                                  className={cn(
                                    'text-xs font-medium px-2 py-0.5 rounded-full',
                                    item.change.startsWith('+') || item.change.startsWith('up')
                                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                      : item.change.startsWith('-') || item.change.startsWith('down')
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                  )}
                                >
                                  {item.change}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : showForm ? (
        /* ---- Report Creation Form ---- */
        <div className="space-y-6">
          {/* Brand & Date Range */}
          <Card>
            <CardHeader>
              <CardTitle>Create Report</CardTitle>
              <CardDescription>
                Select a brand, date range, and report type to generate an AI-powered marketing report.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Brand selector */}
              <div className="space-y-2">
                <Label htmlFor="brand-select">Brand</Label>
                <select
                  id="brand-select"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={selectedBrandId}
                  onChange={(e) => setSelectedBrandId(e.target.value)}
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Template selection */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Select Report Type</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template) => {
                const isSelected = selectedType === template.key
                return (
                  <Card
                    key={template.key}
                    className={cn(
                      'cursor-pointer transition-colors',
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/50'
                    )}
                    onClick={() => setSelectedType(template.key)}
                  >
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
                        <div className="flex-1">
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Error display */}
          {generationError && (
            <Card className="border-destructive">
              <CardContent className="flex items-start gap-3 py-4">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-destructive">Generation Failed</p>
                  <p className="text-sm text-muted-foreground">{generationError}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate button */}
          <div className="flex justify-end">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={!selectedBrandId || !selectedType || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Generate Report
                </>
              )}
            </Button>
          </div>

          {/* Loading state during generation */}
          {generating && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generating Your Report</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Claude AI is analyzing your marketing data and preparing a comprehensive report.
                  This typically takes 10-20 seconds.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* ---- Default View: Templates + Empty states ---- */
        <>
          {/* Report Templates */}
          <div>
            <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {reportTemplates.map((template) => (
                <Card
                  key={template.key}
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => handleTemplateClick(template.key)}
                >
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
