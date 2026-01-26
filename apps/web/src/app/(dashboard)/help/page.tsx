'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  HelpCircle,
  Book,
  MessageCircle,
  Video,
  FileText,
  ExternalLink,
  Search,
  Lightbulb,
  Zap,
  BarChart3,
  Target,
  PenTool,
  Users,
  Settings,
  Mail,
  Phone,
} from 'lucide-react'

const quickStartGuides = [
  {
    title: 'Getting Started with StewardGrowth',
    description: 'Learn the basics of setting up your first brand and campaign',
    icon: Zap,
    duration: '5 min read',
  },
  {
    title: 'Setting Up Event Tracking',
    description: 'Install the tracking SDK and start capturing marketing events',
    icon: BarChart3,
    duration: '10 min read',
  },
  {
    title: 'Creating Your First Ad Campaign',
    description: 'Connect ad platforms and launch your first campaign',
    icon: Target,
    duration: '8 min read',
  },
  {
    title: 'AI Content Generation',
    description: 'Use AI to generate on-brand marketing content',
    icon: PenTool,
    duration: '6 min read',
  },
]

const helpCategories = [
  {
    title: 'Brand Management',
    description: 'Managing SaaS brands, settings, and team members',
    icon: Users,
    articles: 12,
  },
  {
    title: 'Analytics & Reporting',
    description: 'Understanding your marketing metrics and KPIs',
    icon: BarChart3,
    articles: 18,
  },
  {
    title: 'Ad Campaigns',
    description: 'Creating and optimizing campaigns across platforms',
    icon: Target,
    articles: 24,
  },
  {
    title: 'SEO & Content',
    description: 'Improving rankings and creating engaging content',
    icon: FileText,
    articles: 15,
  },
  {
    title: 'AI Features',
    description: 'Leveraging AI for recommendations and automation',
    icon: Lightbulb,
    articles: 10,
  },
  {
    title: 'Settings & Integrations',
    description: 'Configuring your account and connecting services',
    icon: Settings,
    articles: 20,
  },
]

const popularArticles = [
  'How to connect Google Ads to StewardGrowth',
  'Understanding attribution models',
  'Setting up conversion tracking',
  'Best practices for AI content generation',
  'Managing marketing budgets across brands',
  'Interpreting your SEO health score',
]

export default function HelpPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center gap-3">
          <HelpCircle className="h-8 w-8 text-primary" />
          Help Center
        </h1>
        <p className="text-muted-foreground mt-2">
          Find answers, learn best practices, and get support
        </p>

        {/* Search */}
        <div className="mt-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for help articles..."
            className="pl-10 h-12 text-lg"
          />
        </div>
      </div>

      {/* Quick Start Guides */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Quick Start Guides
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickStartGuides.map((guide) => (
            <Card key={guide.title} className="card-hover cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <guide.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{guide.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{guide.description}</p>
                    <p className="text-xs text-primary mt-2">{guide.duration}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Help Categories */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Book className="h-5 w-5 text-blue-500" />
          Browse by Category
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {helpCategories.map((category) => (
            <Card key={category.title} className="card-hover cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <category.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">{category.title}</p>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                    <p className="text-xs text-muted-foreground mt-2">{category.articles} articles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Articles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Popular Articles
            </CardTitle>
            <CardDescription>Most read help articles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {popularArticles.map((article, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <span className="text-sm">{article}</span>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Need More Help?
            </CardTitle>
            <CardDescription>Get in touch with our support team</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button variant="outline" className="justify-start h-auto py-3">
                <MessageCircle className="mr-3 h-5 w-5 text-green-500" />
                <div className="text-left">
                  <p className="font-medium">Live Chat</p>
                  <p className="text-xs text-muted-foreground">Chat with our support team</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3">
                <Mail className="mr-3 h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <p className="font-medium">Email Support</p>
                  <p className="text-xs text-muted-foreground">support@stewardgrowth.com</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3">
                <Video className="mr-3 h-5 w-5 text-purple-500" />
                <div className="text-left">
                  <p className="font-medium">Schedule a Demo</p>
                  <p className="text-xs text-muted-foreground">Get a personalized walkthrough</p>
                </div>
              </Button>

              <Button variant="outline" className="justify-start h-auto py-3">
                <Phone className="mr-3 h-5 w-5 text-orange-500" />
                <div className="text-left">
                  <p className="font-medium">Phone Support</p>
                  <p className="text-xs text-muted-foreground">Enterprise customers only</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Video Tutorials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Tutorials
          </CardTitle>
          <CardDescription>Learn through step-by-step video guides</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'Platform Overview', duration: '12:30' },
              { title: 'Setting Up Your First Brand', duration: '8:45' },
              { title: 'Understanding Analytics Dashboard', duration: '15:20' },
            ].map((video, i) => (
              <div key={i} className="border rounded-lg overflow-hidden cursor-pointer hover:border-primary transition-colors">
                <div className="aspect-video bg-muted flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm">{video.title}</p>
                  <p className="text-xs text-muted-foreground">{video.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
