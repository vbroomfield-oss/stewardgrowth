'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  Brain,
  Target,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock AI recommendations
const mockRecommendations = [
  {
    id: '1',
    type: 'budget',
    priority: 'high',
    title: 'Scale Google Ads Campaign',
    description: 'Your "Church Software - Search" campaign has a 3.2x ROAS. Increasing the daily budget from $50 to $75 could yield an additional 15 conversions/month.',
    impact: '+$4,500 projected revenue',
    confidence: 87,
    status: 'pending',
    createdAt: '2 hours ago',
  },
  {
    id: '2',
    type: 'content',
    priority: 'high',
    title: 'Create Content for Trending Topic',
    description: '"Church volunteer management" searches increased 40% this month. Creating a comprehensive guide could capture this traffic.',
    impact: '+2,400 organic visits/month',
    confidence: 82,
    status: 'pending',
    createdAt: '5 hours ago',
  },
  {
    id: '3',
    type: 'optimization',
    priority: 'medium',
    title: 'Pause Underperforming LinkedIn Campaign',
    description: 'Your "Church Admin Demo" campaign has a 0.8x ROAS. Recommend pausing and reallocating budget to better performing channels.',
    impact: 'Save $500/month',
    confidence: 91,
    status: 'pending',
    createdAt: '1 day ago',
  },
  {
    id: '4',
    type: 'seo',
    priority: 'medium',
    title: 'Fix Technical SEO Issues',
    description: '8 pages have duplicate meta descriptions. Fixing these could improve rankings for affected pages.',
    impact: '+5% organic traffic',
    confidence: 78,
    status: 'accepted',
    createdAt: '2 days ago',
  },
]

const mockWeeklyPlan = {
  week: 'Jan 22 - Jan 28, 2024',
  budget: {
    total: 2500,
    breakdown: {
      'Google Ads': 1200,
      'Meta Ads': 800,
      'LinkedIn Ads': 300,
      'Content': 200,
    },
  },
  tasks: [
    { day: 'Mon', task: 'Launch new Google search campaign for "church member database"', type: 'ads' },
    { day: 'Tue', task: 'Publish blog post: "Complete Guide to Church Management Software"', type: 'content' },
    { day: 'Wed', task: 'Review and refresh Meta retargeting ad creatives', type: 'ads' },
    { day: 'Thu', task: 'Send monthly newsletter to 2,400 subscribers', type: 'email' },
    { day: 'Fri', task: 'Analyze weekly performance and adjust bids', type: 'analytics' },
  ],
  goals: [
    { metric: 'Leads', target: 45, current: 12 },
    { metric: 'Trials', target: 20, current: 5 },
    { metric: 'MRR Added', target: 2500, current: 800 },
  ],
}

const typeIcons: Record<string, typeof Target> = {
  budget: DollarSign,
  content: Lightbulb,
  optimization: TrendingUp,
  seo: BarChart3,
}

export default function AIPage() {
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([
    { role: 'ai', message: 'Hi! I\'m your AI Marketing Assistant. I can help you analyze campaigns, suggest optimizations, generate content ideas, or answer questions about your marketing performance. What would you like to know?' },
  ])

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatInput('')
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }])

    // Simulate AI response
    setTimeout(() => {
      const responses: Record<string, string> = {
        default: `Based on your current data, here are my observations about "${userMessage}":\n\n1. Your Google Ads campaigns are performing above industry benchmarks with a 3.2x ROAS.\n\n2. Content marketing is driving 35% of your qualified leads.\n\n3. There's an opportunity to expand into LinkedIn with a focused campaign for church administrators.\n\nWould you like me to create an action plan for any of these areas?`,
      }

      setChatHistory(prev => [...prev, {
        role: 'ai',
        message: responses.default,
      }])
    }, 1000)
  }

  const handleAcceptRecommendation = (id: string) => {
    // In production: Create approval request
    alert('Recommendation accepted and sent to approval queue!')
  }

  const handleDismissRecommendation = (id: string) => {
    // In production: Mark as dismissed with feedback
    alert('Recommendation dismissed')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Brain className="h-8 w-8 text-purple-500" />
          AI Marketing Intelligence
        </h1>
        <p className="text-muted-foreground">
          Your AI-powered marketing strategist and advisor
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                AI Recommendations
              </CardTitle>
              <CardDescription>
                Smart actions to improve your marketing performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockRecommendations.map((rec) => {
                const Icon = typeIcons[rec.type] || Lightbulb
                return (
                  <div
                    key={rec.id}
                    className={cn(
                      'p-4 border rounded-lg',
                      rec.priority === 'high' && rec.status === 'pending'
                        ? 'border-l-4 border-l-purple-500 bg-purple-50/50 dark:bg-purple-900/10'
                        : rec.status === 'accepted'
                        ? 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10'
                        : ''
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        'p-2 rounded-lg',
                        rec.priority === 'high' ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-gray-800'
                      )}>
                        <Icon className={cn(
                          'h-5 w-5',
                          rec.priority === 'high' ? 'text-purple-600' : 'text-gray-600'
                        )} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{rec.title}</h4>
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            rec.priority === 'high'
                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50'
                              : 'bg-gray-100 text-gray-700 dark:bg-gray-800'
                          )}>
                            {rec.priority}
                          </span>
                          {rec.status === 'accepted' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <span className="text-green-600 font-medium">{rec.impact}</span>
                          <span className="text-muted-foreground">
                            {rec.confidence}% confidence
                          </span>
                          <span className="text-muted-foreground">{rec.createdAt}</span>
                        </div>
                      </div>
                      {rec.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAcceptRecommendation(rec.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDismissRecommendation(rec.id)}
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Weekly Marketing Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Weekly Marketing Plan
              </CardTitle>
              <CardDescription>{mockWeeklyPlan.week}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Tasks */}
                <div>
                  <h4 className="font-medium mb-3">Scheduled Tasks</h4>
                  <div className="space-y-2">
                    {mockWeeklyPlan.tasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-3 p-2 bg-muted/50 rounded">
                        <span className="text-xs font-medium text-muted-foreground w-8">
                          {task.day}
                        </span>
                        <span className="text-sm flex-1">{task.task}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Budget & Goals */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Budget Allocation</h4>
                    <div className="space-y-2">
                      {Object.entries(mockWeeklyPlan.budget.breakdown).map(([channel, amount]) => (
                        <div key={channel} className="flex items-center justify-between">
                          <span className="text-sm">{channel}</span>
                          <span className="text-sm font-medium">${amount}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="font-medium">Total</span>
                        <span className="font-bold">${mockWeeklyPlan.budget.total}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Weekly Goals</h4>
                    <div className="space-y-3">
                      {mockWeeklyPlan.goals.map((goal, i) => (
                        <div key={i}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>{goal.metric}</span>
                            <span>{goal.current} / {goal.target}</span>
                          </div>
                          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${Math.min((goal.current / goal.target) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Chat */}
        <div>
          <Card className="h-[700px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-500" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat History */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'p-3 rounded-lg max-w-[90%]',
                      msg.role === 'user'
                        ? 'ml-auto bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="flex gap-2">
                <Textarea
                  placeholder="Ask me anything about your marketing..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="min-h-[60px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage} size="icon" className="h-auto">
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mt-3">
                {['Campaign performance', 'Content ideas', 'Budget advice'].map((action) => (
                  <Button
                    key={action}
                    variant="outline"
                    size="sm"
                    onClick={() => setChatInput(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
