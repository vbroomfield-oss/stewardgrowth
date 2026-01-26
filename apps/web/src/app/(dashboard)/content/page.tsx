'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import {
  FileText,
  PenTool,
  Calendar,
  Sparkles,
  Plus,
  Search,
  Filter,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Mail,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock content data
const mockContent = [
  {
    id: '1',
    title: '5 Ways AI Transforms Church Management',
    type: 'blog',
    brand: 'StewardMAX',
    status: 'published',
    platform: null,
    scheduledAt: null,
    publishedAt: '2024-01-20',
    performance: { views: 1234, engagement: 4.5 },
  },
  {
    id: '2',
    title: 'Why Churches Need Cloud Phone Systems in 2024',
    type: 'social',
    brand: 'StewardRing',
    status: 'scheduled',
    platform: 'linkedin',
    scheduledAt: '2024-01-25T10:00:00Z',
    publishedAt: null,
    performance: null,
  },
  {
    id: '3',
    title: 'Free Trial Announcement - StewardMAX',
    type: 'social',
    brand: 'StewardMAX',
    status: 'pending_approval',
    platform: 'twitter',
    scheduledAt: null,
    publishedAt: null,
    performance: null,
  },
  {
    id: '4',
    title: 'Monthly Newsletter - January 2024',
    type: 'email',
    brand: 'StewardMAX',
    status: 'draft',
    platform: null,
    scheduledAt: null,
    publishedAt: null,
    performance: null,
  },
  {
    id: '5',
    title: 'Church Management Made Easy - Carousel',
    type: 'social',
    brand: 'StewardMAX',
    status: 'published',
    platform: 'instagram',
    scheduledAt: null,
    publishedAt: '2024-01-18',
    performance: { views: 2340, engagement: 6.2 },
  },
]

const mockIdeas = [
  {
    id: '1',
    title: 'How to Increase Church Giving by 30%',
    description: 'Data-driven strategies for improving donation rates',
    angle: 'Case study with real numbers',
    type: 'blog',
    score: 92,
  },
  {
    id: '2',
    title: 'The Future of Virtual Church Services',
    description: 'Trends and technology for hybrid worship',
    angle: 'Expert predictions + actionable tips',
    type: 'blog',
    score: 88,
  },
  {
    id: '3',
    title: 'Why Your Church Needs a Mobile App',
    description: 'Benefits of mobile engagement for congregations',
    angle: 'ROI-focused with statistics',
    type: 'social',
    score: 85,
  },
]

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700', icon: Calendar },
  published: { label: 'Published', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
}

const platformIcons: Record<string, typeof Twitter> = {
  twitter: Twitter,
  linkedin: Linkedin,
  facebook: Facebook,
  instagram: Instagram,
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredContent = mockContent.filter(content => {
    if (activeTab !== 'all' && content.type !== activeTab) return false
    if (searchQuery && !content.title.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Hub</h1>
          <p className="text-muted-foreground">
            Create, schedule, and manage all your marketing content
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/content/calendar">
              <Calendar className="mr-2 h-4 w-4" />
              Calendar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/content/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Content
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{mockContent.length}</p>
                <p className="text-sm text-muted-foreground">Total Content</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockContent.filter(c => c.status === 'pending_approval').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockContent.filter(c => c.status === 'scheduled').length}
                </p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {mockContent.filter(c => c.status === 'published').length}
                </p>
                <p className="text-sm text-muted-foreground">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Content Ideas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Content Ideas
          </CardTitle>
          <CardDescription>
            AI-suggested content based on trending topics and your audience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {mockIdeas.map((idea) => (
              <div
                key={idea.id}
                className="p-4 border rounded-lg hover:border-purple-500 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {idea.type}
                  </span>
                  <span className="text-xs font-bold text-purple-600">
                    {idea.score}% match
                  </span>
                </div>
                <h4 className="font-medium mb-1">{idea.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{idea.description}</p>
                <p className="text-xs text-purple-600">Angle: {idea.angle}</p>
                <Button size="sm" variant="ghost" className="mt-3 w-full">
                  <PenTool className="mr-2 h-3 w-3" />
                  Create from Idea
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Content List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Content Library</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search content..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="blog">Blog</TabsTrigger>
              <TabsTrigger value="social">Social</TabsTrigger>
              <TabsTrigger value="email">Email</TabsTrigger>
              <TabsTrigger value="ad">Ads</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              <div className="space-y-3">
                {filteredContent.map((content) => {
                  const status = statusConfig[content.status as keyof typeof statusConfig]
                  const StatusIcon = status.icon
                  const PlatformIcon = content.platform ? platformIcons[content.platform] : null

                  return (
                    <div
                      key={content.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Platform Icon */}
                      <div className="p-2 rounded-lg bg-muted">
                        {PlatformIcon ? (
                          <PlatformIcon className="h-5 w-5" />
                        ) : content.type === 'blog' ? (
                          <FileText className="h-5 w-5" />
                        ) : content.type === 'email' ? (
                          <Mail className="h-5 w-5" />
                        ) : (
                          <Target className="h-5 w-5" />
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            {content.brand}
                          </span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {content.type}
                          </span>
                        </div>
                        <h4 className="font-medium truncate">{content.title}</h4>
                        {content.scheduledAt && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Scheduled: {new Date(content.scheduledAt).toLocaleDateString()}
                          </p>
                        )}
                        {content.performance && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {content.performance.views.toLocaleString()} views • {content.performance.engagement}% engagement
                          </p>
                        )}
                      </div>

                      {/* Status */}
                      <span className={cn(
                        'px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1',
                        status.color
                      )}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </span>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}

                {filteredContent.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No content found</p>
                    <Button variant="outline" className="mt-4" asChild>
                      <Link href="/content/create">Create your first content</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/content/create?type=blog">
          <Card className="hover:border-blue-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium">Write Blog Post</p>
                <p className="text-sm text-gray-500">AI-assisted writing</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/create?type=social">
          <Card className="hover:border-purple-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Twitter className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="font-medium">Social Post</p>
                <p className="text-sm text-gray-500">Multi-platform</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/create?type=email">
          <Card className="hover:border-green-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium">Email Campaign</p>
                <p className="text-sm text-gray-500">Newsletter & nurture</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/content/create?type=ad">
          <Card className="hover:border-orange-500 transition-colors cursor-pointer h-full">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Target className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="font-medium">Ad Copy</p>
                <p className="text-sm text-gray-500">Google, Meta, LinkedIn</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
