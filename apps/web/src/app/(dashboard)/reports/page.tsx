'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BarChart3,
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Plus,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const reportTemplates = [
  { name: 'Executive Summary', description: 'High-level overview of all marketing metrics', icon: BarChart3, color: 'blue' },
  { name: 'Lead Generation', description: 'Detailed lead sources and conversion paths', icon: Users, color: 'green' },
  { name: 'Revenue Attribution', description: 'Which channels drive the most revenue', icon: DollarSign, color: 'purple' },
  { name: 'Ad Performance', description: 'Campaign performance across all platforms', icon: Target, color: 'orange' },
  { name: 'SEO Progress', description: 'Ranking improvements and organic traffic', icon: TrendingUp, color: 'teal' },
  { name: 'Content Performance', description: 'Engagement metrics for published content', icon: FileText, color: 'pink' },
]

const recentReports = [
  { name: 'January 2025 Executive Summary', type: 'Executive Summary', createdAt: '2 days ago', status: 'ready' },
  { name: 'Q4 2024 Revenue Attribution', type: 'Revenue Attribution', createdAt: '1 week ago', status: 'ready' },
  { name: 'December Ad Performance', type: 'Ad Performance', createdAt: '2 weeks ago', status: 'ready' },
  { name: 'Weekly Lead Report - Jan 13', type: 'Lead Generation', createdAt: '3 weeks ago', status: 'ready' },
]

const scheduledReports = [
  { name: 'Weekly Executive Summary', frequency: 'Every Monday', nextRun: 'Jan 27, 9:00 AM' },
  { name: 'Monthly Revenue Report', frequency: 'First of month', nextRun: 'Feb 1, 9:00 AM' },
  { name: 'Quarterly Business Review', frequency: 'Quarterly', nextRun: 'Apr 1, 9:00 AM' },
]

export default function ReportsPage() {
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
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Report
        </Button>
      </div>

      {/* Report Templates */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Report Templates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportTemplates.map((template) => (
            <Card key={template.name} className="card-hover cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'p-2 rounded-lg',
                    template.color === 'blue' && 'bg-blue-100',
                    template.color === 'green' && 'bg-green-100',
                    template.color === 'purple' && 'bg-purple-100',
                    template.color === 'orange' && 'bg-orange-100',
                    template.color === 'teal' && 'bg-teal-100',
                    template.color === 'pink' && 'bg-pink-100',
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
        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Previously generated reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.type} • {report.createdAt}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="mr-2 h-3 w-3" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scheduled Reports</CardTitle>
                <CardDescription>Automated recurring reports</CardDescription>
              </div>
              <Button size="sm" variant="outline">
                <Plus className="mr-2 h-3 w-3" />
                Schedule
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scheduledReports.map((report, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-muted-foreground">{report.frequency}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Next run</p>
                    <p className="text-sm font-medium">{report.nextRun}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
