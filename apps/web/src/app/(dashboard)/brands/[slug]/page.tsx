import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from '@/components/dashboard/metric-card'
import {
  Settings,
  ExternalLink,
  ArrowLeft,
  DollarSign,
  Users,
  TrendingUp,
  Target,
  FileText,
  Megaphone,
  Search,
  BarChart3,
  Wallet,
} from 'lucide-react'

// Mock data - will be replaced with real API
const mockBrand = {
  id: '1',
  name: 'StewardMAX',
  slug: 'stewardmax',
  domain: 'stewardmax.com',
  color: '#3b82f6',
  logo: null,
  brandVoice: {
    tone: 'Professional yet approachable',
    personality: 'Helpful, knowledgeable, trustworthy',
    keywords: ['church management', 'ministry', 'stewardship', 'congregation'],
    avoidWords: ['competitor names', 'negative language'],
  },
  targetAudiences: [
    {
      name: 'Church Administrators',
      demographics: '35-55 years old, decision makers',
      painPoints: ['Time-consuming manual processes', 'Disconnected systems'],
    },
    {
      name: 'Pastors',
      demographics: '40-60 years old, spiritual leaders',
      painPoints: ['Lack of engagement visibility', 'Difficulty tracking growth'],
    },
  ],
  goals: {
    monthly: { leads: 200, trials: 50, mrr: 80000 },
  },
  metrics: {
    mrr: 75000,
    previousMrr: 69000,
    leads: 1523,
    previousLeads: 1356,
    trials: 234,
    previousTrials: 210,
    adSpend: 8500,
    previousAdSpend: 8200,
    conversionRate: 15.4,
    previousConversionRate: 14.8,
    cac: 142,
    previousCac: 155,
  },
}

export default function BrandDetailPage({ params }: { params: { slug: string } }) {
  const brand = mockBrand // In production, fetch by params.slug

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/brands">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: brand.color }}
            >
              {brand.name[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{brand.name}</h1>
              <a
                href={`https://${brand.domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {brand.domain}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/brands/${brand.slug}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Brand Settings
          </Link>
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <MetricCard
          title="MRR"
          value={brand.metrics.mrr}
          previousValue={brand.metrics.previousMrr}
          format="currency"
          icon={DollarSign}
        />
        <MetricCard
          title="Leads"
          value={brand.metrics.leads}
          previousValue={brand.metrics.previousLeads}
          icon={Users}
        />
        <MetricCard
          title="Trials"
          value={brand.metrics.trials}
          previousValue={brand.metrics.previousTrials}
          icon={TrendingUp}
        />
        <MetricCard
          title="Conversion"
          value={brand.metrics.conversionRate}
          previousValue={brand.metrics.previousConversionRate}
          format="percent"
          icon={Target}
        />
        <MetricCard
          title="Ad Spend"
          value={brand.metrics.adSpend}
          previousValue={brand.metrics.previousAdSpend}
          format="currency"
          icon={Megaphone}
        />
        <MetricCard
          title="CAC"
          value={brand.metrics.cac}
          previousValue={brand.metrics.previousCac}
          format="currency"
          icon={DollarSign}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="ads">Ads</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Brand Voice */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Voice</CardTitle>
                <CardDescription>
                  AI content generation will follow these guidelines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Tone</p>
                  <p className="text-sm text-muted-foreground">{brand.brandVoice.tone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Personality</p>
                  <p className="text-sm text-muted-foreground">{brand.brandVoice.personality}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Keywords</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {brand.brandVoice.keywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target Audiences */}
            <Card>
              <CardHeader>
                <CardTitle>Target Audiences</CardTitle>
                <CardDescription>
                  Primary audience segments for marketing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {brand.targetAudiences.map((audience, i) => (
                  <div key={i} className="p-3 border rounded-lg">
                    <p className="font-medium">{audience.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{audience.demographics}</p>
                    <div className="mt-2">
                      <p className="text-xs font-medium">Pain Points:</p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside">
                        {audience.painPoints.map((point, j) => (
                          <li key={j}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Goals vs Actuals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Leads</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold">{brand.metrics.leads}</span>
                    <span className="text-sm text-muted-foreground">/ {brand.goals.monthly.leads} goal</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min((brand.metrics.leads / brand.goals.monthly.leads) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Trials</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold">{brand.metrics.trials}</span>
                    <span className="text-sm text-muted-foreground">/ {brand.goals.monthly.trials} goal</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min((brand.metrics.trials / brand.goals.monthly.trials) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">MRR</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-2xl font-bold">${(brand.metrics.mrr / 1000).toFixed(0)}K</span>
                    <span className="text-sm text-muted-foreground">/ ${(brand.goals.monthly.mrr / 1000).toFixed(0)}K goal</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min((brand.metrics.mrr / brand.goals.monthly.mrr) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <div className="grid gap-4 md:grid-cols-5">
            <Link href={`/brands/${brand.slug}/funding`} className="block">
              <Card className="card-hover cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Wallet className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium">Marketing Funds</p>
                    <p className="text-xs text-muted-foreground">Add budget & spend</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/seo?brand=${brand.slug}`} className="block">
              <Card className="card-hover cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Search className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium">SEO Dashboard</p>
                    <p className="text-xs text-muted-foreground">View rankings & tasks</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/content?brand=${brand.slug}`} className="block">
              <Card className="card-hover cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium">Content Hub</p>
                    <p className="text-xs text-muted-foreground">Manage posts & calendar</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/ads?brand=${brand.slug}`} className="block">
              <Card className="card-hover cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Megaphone className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="font-medium">Ads Manager</p>
                    <p className="text-xs text-muted-foreground">Campaigns & performance</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link href={`/analytics/kpis?brand=${brand.slug}`} className="block">
              <Card className="card-hover cursor-pointer h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <BarChart3 className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-medium">Analytics</p>
                    <p className="text-xs text-muted-foreground">KPIs & attribution</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              SEO analysis and tasks for {brand.name}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Content posts and calendar for {brand.name}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ads" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Ad campaigns and performance for {brand.name}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Brand settings and configuration
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
