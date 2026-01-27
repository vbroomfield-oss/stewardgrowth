'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MetricCard, MetricGrid } from '@/components/charts/metric-card'
import {
  Search,
  TrendingUp,
  TrendingDown,
  Globe,
  FileText,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
  Target,
  Zap,
  BarChart3,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock SEO data
const mockSEOScore = 78
const mockKeywords = [
  { keyword: 'church management software', position: 4, change: 2, volume: 2400, difficulty: 65, url: '/blog/church-management-guide' },
  { keyword: 'church software', position: 7, change: -1, volume: 1900, difficulty: 72, url: '/features' },
  { keyword: 'church member database', position: 12, change: 5, volume: 880, difficulty: 45, url: '/features/people' },
  { keyword: 'online giving for churches', position: 18, change: 3, volume: 1200, difficulty: 58, url: '/features/giving' },
  { keyword: 'church volunteer management', position: 23, change: 0, volume: 720, difficulty: 38, url: '/features/volunteers' },
  { keyword: 'best church management software', position: 31, change: 8, volume: 1800, difficulty: 78, url: '/comparison' },
]

const mockIssues = [
  { type: 'critical', count: 2, description: 'Missing meta descriptions' },
  { type: 'warning', count: 8, description: 'Images without alt text' },
  { type: 'warning', count: 5, description: 'Pages with thin content (<300 words)' },
  { type: 'info', count: 12, description: 'Internal links could be improved' },
]

const mockTasks = [
  { id: '1', task: 'Add meta description to /features/giving', priority: 'high', impact: 'Medium traffic page missing SEO basics', status: 'pending' },
  { id: '2', task: 'Create content for "church check-in software" keyword', priority: 'high', impact: 'High volume keyword with low competition', status: 'pending' },
  { id: '3', task: 'Fix broken internal links (3 found)', priority: 'medium', impact: 'Improves crawlability and user experience', status: 'in_progress' },
  { id: '4', task: 'Add alt text to 8 images', priority: 'medium', impact: 'Accessibility and image SEO improvement', status: 'pending' },
  { id: '5', task: 'Optimize page speed for /pricing', priority: 'low', impact: 'Page loads in 4.2s, target <3s', status: 'pending' },
]

const mockCompetitors = [
  { name: 'Planning Center', domain: 'planningcenter.com', score: 82, keywords: 450 },
  { name: 'Breeze ChMS', domain: 'breezechms.com', score: 75, keywords: 280 },
  { name: 'Church Community Builder', domain: 'churchcommunitybuilder.com', score: 71, keywords: 320 },
]

export default function SEOPage() {
  const [selectedBrand, setSelectedBrand] = useState('stewardmax')
  const [crawling, setCrawling] = useState(false)

  const handleCrawl = () => {
    setCrawling(true)
    setTimeout(() => setCrawling(false), 3000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SEO Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor rankings, fix issues, and discover opportunities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="stewardmax">StewardMAX</option>
            <option value="stewardring">StewardRing</option>
          </select>
          <Button variant="outline" onClick={handleCrawl} disabled={crawling}>
            {crawling ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Audit
              </>
            )}
          </Button>
        </div>
      </div>

      {/* SEO Score & Metrics */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="md:col-span-1">
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200 dark:text-gray-700"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${mockSEOScore * 2.51} 251`}
                  className={cn(
                    mockSEOScore >= 80 ? 'text-green-500' :
                    mockSEOScore >= 60 ? 'text-yellow-500' :
                    'text-red-500'
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{mockSEOScore}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">SEO Score</p>
          </CardContent>
        </Card>

        <MetricCard
          title="Organic Traffic"
          value={12453}
          change={8.3}
          sparklineData={[9000, 10000, 10500, 11200, 11800, 12100, 12453]}
        />
        <MetricCard
          title="Keywords Ranked"
          value={156}
          change={12}
        />
        <MetricCard
          title="Backlinks"
          value={342}
          change={5.2}
        />
        <MetricCard
          title="Domain Authority"
          value={38}
          change={2}
        />
      </div>

      {/* Issues Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Issues Found
          </CardTitle>
          <CardDescription>
            Technical SEO issues that need attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            {mockIssues.map((issue, i) => (
              <div
                key={i}
                className={cn(
                  'p-4 rounded-lg border',
                  issue.type === 'critical' ? 'border-red-200 bg-red-50 dark:bg-red-900/10' :
                  issue.type === 'warning' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10' :
                  'border-blue-200 bg-blue-50 dark:bg-blue-900/10'
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    'text-2xl font-bold',
                    issue.type === 'critical' ? 'text-red-600' :
                    issue.type === 'warning' ? 'text-yellow-600' :
                    'text-blue-600'
                  )}>
                    {issue.count}
                  </span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full font-medium uppercase',
                    issue.type === 'critical' ? 'bg-red-100 text-red-700' :
                    issue.type === 'warning' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  )}>
                    {issue.type}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{issue.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Keyword Rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              Keyword Rankings
            </CardTitle>
            <CardDescription>
              Track your positions for target keywords
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockKeywords.map((kw, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-12 text-center">
                    <span className={cn(
                      'text-lg font-bold',
                      kw.position <= 10 ? 'text-green-600' :
                      kw.position <= 20 ? 'text-yellow-600' :
                      'text-gray-600'
                    )}>
                      #{kw.position}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{kw.keyword}</p>
                    <p className="text-xs text-muted-foreground">
                      Vol: {kw.volume.toLocaleString()} • Diff: {kw.difficulty}%
                    </p>
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 text-sm font-medium',
                    kw.change > 0 ? 'text-green-600' :
                    kw.change < 0 ? 'text-red-600' :
                    'text-gray-500'
                  )}>
                    {kw.change > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : kw.change < 0 ? (
                      <TrendingDown className="h-4 w-4" />
                    ) : null}
                    {kw.change !== 0 && Math.abs(kw.change)}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Keywords
            </Button>
          </CardContent>
        </Card>

        {/* AI SEO Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              AI-Recommended Tasks
            </CardTitle>
            <CardDescription>
              Prioritized actions to improve your SEO
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockTasks.map((task) => (
                <div key={task.id} className="p-3 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'mt-1 h-2 w-2 rounded-full',
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-blue-500'
                    )} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.task}</p>
                      <p className="text-xs text-muted-foreground mt-1">{task.impact}</p>
                    </div>
                    <span className={cn(
                      'text-xs px-2 py-1 rounded-full',
                      task.status === 'pending' ? 'bg-gray-100 text-gray-700' :
                      task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-green-100 text-green-700'
                    )}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Competitor Analysis
          </CardTitle>
          <CardDescription>
            See how you stack up against the competition
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {mockCompetitors.map((competitor, i) => (
              <div key={i} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-medium">{competitor.name}</p>
                    <p className="text-xs text-muted-foreground">{competitor.domain}</p>
                  </div>
                  <Button variant="ghost" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold">{competitor.score}</p>
                    <p className="text-xs text-muted-foreground">SEO Score</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{competitor.keywords}</p>
                    <p className="text-xs text-muted-foreground">Keywords</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/ai">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Search className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">AI Recommendations</p>
                <p className="text-sm text-gray-500">Get AI-powered insights</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/analytics/events">
          <Card className="hover:border-green-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <Globe className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Event Analytics</p>
                <p className="text-sm text-gray-500">View traffic sources</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <FileText className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-medium">Content Hub</p>
                <p className="text-sm text-gray-500">Create SEO content</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
