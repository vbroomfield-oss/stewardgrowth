import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BrandCard } from '@/components/dashboard/brand-card'
import {
  Plus,
  Search,
  Building2,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react'

// Mock data
const mockBrands = [
  {
    id: '1',
    name: 'StewardMAX',
    slug: 'stewardmax',
    domain: 'stewardmax.com',
    color: '#3b82f6',
    metrics: {
      mrr: 75000,
      mrrChange: 8.5,
      leads: 1523,
      leadsChange: 12.3,
      trials: 234,
      adSpend: 8500,
    },
  },
  {
    id: '2',
    name: 'StewardRing',
    slug: 'stewardring',
    domain: 'stewardring.com',
    color: '#22c55e',
    metrics: {
      mrr: 35000,
      mrrChange: 5.2,
      leads: 892,
      leadsChange: 15.7,
      trials: 156,
      adSpend: 4200,
    },
  },
  {
    id: '3',
    name: 'StewardPro',
    slug: 'stewardpro',
    domain: 'stewardpro.io',
    color: '#a855f7',
    metrics: {
      mrr: 15000,
      mrrChange: -2.1,
      leads: 432,
      leadsChange: -5.3,
      trials: 67,
      adSpend: 2720,
    },
  },
]

const totalMetrics = mockBrands.reduce(
  (acc, brand) => ({
    mrr: acc.mrr + brand.metrics.mrr,
    leads: acc.leads + brand.metrics.leads,
    trials: acc.trials + brand.metrics.trials,
    adSpend: acc.adSpend + brand.metrics.adSpend,
  }),
  { mrr: 0, leads: 0, trials: 0, adSpend: 0 }
)

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
          <p className="text-muted-foreground">
            Manage your SaaS products and marketing settings
          </p>
        </div>
        <Button asChild>
          <Link href="/brands/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Brand
          </Link>
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockBrands.length}</p>
                <p className="text-sm text-muted-foreground">Total Brands</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(totalMetrics.mrr / 1000).toFixed(0)}K</p>
                <p className="text-sm text-muted-foreground">Combined MRR</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <Users className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalMetrics.leads.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Total Leads</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <TrendingUp className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(totalMetrics.adSpend / 1000).toFixed(1)}K</p>
                <p className="text-sm text-muted-foreground">Monthly Ad Spend</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search brands..." className="pl-10" />
        </div>
      </div>

      {/* Brand Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockBrands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  )
}
