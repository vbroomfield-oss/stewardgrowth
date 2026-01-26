'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Percent,
  Calendar,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const kpis = [
  { name: 'Monthly Recurring Revenue', value: '$125,000', change: 8.7, trend: 'up', icon: DollarSign },
  { name: 'Total Leads', value: '2,847', change: 12.3, trend: 'up', icon: Users },
  { name: 'Conversion Rate', value: '15.4%', change: 4.1, trend: 'up', icon: Percent },
  { name: 'Customer Acquisition Cost', value: '$142', change: -8.4, trend: 'down', icon: Target },
  { name: 'Lifetime Value', value: '$1,420', change: 5.2, trend: 'up', icon: DollarSign },
  { name: 'Churn Rate', value: '2.3%', change: -12.5, trend: 'down', icon: TrendingDown },
]

const brandKpis = [
  { brand: 'StewardMAX', mrr: 75000, leads: 1523, conversion: 18.2, cac: 125, color: '#3b82f6' },
  { brand: 'StewardRing', mrr: 35000, leads: 892, conversion: 14.5, cac: 156, color: '#22c55e' },
  { brand: 'StewardPro', mrr: 15000, leads: 432, conversion: 11.8, cac: 178, color: '#a855f7' },
]

export default function KPIsPage() {
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
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Last 30 Days
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {kpis.map((kpi) => (
          <Card key={kpi.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                <div className={cn(
                  'flex items-center gap-1 text-sm font-medium',
                  kpi.change > 0 ? 'text-green-500' : 'text-red-500'
                )}>
                  {kpi.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </div>
              </div>
              <p className="text-3xl font-bold">{kpi.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{kpi.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Brand Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Comparison</CardTitle>
          <CardDescription>KPIs broken down by brand</CardDescription>
        </CardHeader>
        <CardContent>
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
                {brandKpis.map((brand) => (
                  <tr key={brand.brand} className="border-b last:border-0">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: brand.color }} />
                        <span className="font-medium">{brand.brand}</span>
                      </div>
                    </td>
                    <td className="text-right py-3 px-4 font-semibold">${brand.mrr.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{brand.leads.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{brand.conversion}%</td>
                    <td className="text-right py-3 px-4">${brand.cac}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
