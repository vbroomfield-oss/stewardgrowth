'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  Brain,
  Target,
  MessageSquare,
  Send,
  Plus,
  Loader2,
  RefreshCw,
  ArrowRight,
  Settings,
  Lightbulb,
  TrendingUp,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
}

interface Recommendation {
  id: string
  title: string
  description: string
  type: string
  priority: string
  estimatedImpact: string | null
  status: string
  brand: { name: string; slug: string }
  createdAt: string
}

export default function AIPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [generatingRecs, setGeneratingRecs] = useState(false)
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([
    {
      role: 'ai',
      message:
        "Hi! I'm your AI Marketing Assistant powered by Claude. I can help you analyze campaigns, suggest optimizations, generate content ideas, or answer questions about your marketing strategy. What would you like to know?",
    },
  ])

  useEffect(() => {
    async function fetchData() {
      try {
        const [brandsRes, recsRes] = await Promise.all([
          fetch('/api/brands', { credentials: 'include' }),
          fetch('/api/ai/recommendations', { credentials: 'include' }),
        ])

        if (brandsRes.ok) {
          const data = await brandsRes.json()
          setBrands(data.brands || [])
        }

        if (recsRes.ok) {
          const data = await recsRes.json()
          setRecommendations(data.recommendations || [])
        }
      } catch (err) {
        console.error('Failed to load data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput
    setChatInput('')
    setChatHistory((prev) => [...prev, { role: 'user', message: userMessage }])
    setChatLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: userMessage }),
      })

      if (res.ok) {
        const data = await res.json()
        setChatHistory((prev) => [
          ...prev,
          { role: 'ai', message: data.response },
        ])
      } else {
        setChatHistory((prev) => [
          ...prev,
          {
            role: 'ai',
            message:
              'Sorry, I encountered an error. Please check that your Anthropic API key is configured in Settings > Integrations.',
          },
        ])
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'ai',
          message: 'Failed to connect. Please try again.',
        },
      ])
    } finally {
      setChatLoading(false)
    }
  }

  const handleGenerateRecommendations = async (brandId?: string) => {
    setGeneratingRecs(true)
    try {
      const res = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ brandId }),
      })

      if (res.ok) {
        const data = await res.json()
        // Refresh recommendations list
        const recsRes = await fetch('/api/ai/recommendations', {
          credentials: 'include',
        })
        if (recsRes.ok) {
          const recsData = await recsRes.json()
          setRecommendations(recsData.recommendations || [])
        }
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to generate recommendations')
      }
    } catch {
      alert('Failed to generate recommendations')
    } finally {
      setGeneratingRecs(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const priorityColors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    MEDIUM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    LOW: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    URGENT: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-300',
  }

  const typeIcons: Record<string, typeof Lightbulb> = {
    CONTENT_IDEA: Lightbulb,
    SEO_OPPORTUNITY: TrendingUp,
    MARKET_INSIGHT: Brain,
    BUDGET_REALLOCATION: Target,
    CREATIVE_REFRESH: Sparkles,
    TRENDING_TOPIC: Zap,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-500" />
            AI Marketing Intelligence
          </h1>
          <p className="text-muted-foreground">
            Your AI-powered marketing strategist and advisor
          </p>
        </div>
      </div>

      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-purple-500/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to unlock AI-powered recommendations, campaign
              optimization suggestions, and marketing insights.
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
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Recommendations */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                      AI Recommendations
                    </CardTitle>
                    <CardDescription>
                      Smart actions to improve your marketing performance
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleGenerateRecommendations(
                      selectedBrandFilter === 'all' ? undefined : selectedBrandFilter
                    )}
                    disabled={generatingRecs}
                  >
                    {generatingRecs ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Generate New
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Brand filter tabs */}
                {brands.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Button
                      variant={selectedBrandFilter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedBrandFilter('all')}
                    >
                      All Brands
                    </Button>
                    {brands.map((brand) => (
                      <Button
                        key={brand.id}
                        variant={selectedBrandFilter === brand.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedBrandFilter(brand.id)}
                      >
                        {brand.name}
                      </Button>
                    ))}
                  </div>
                )}

                {recommendations.length > 0 ? (
                  <div className="space-y-3">
                    {recommendations
                      .filter((rec) =>
                        selectedBrandFilter === 'all' ? true : rec.brand?.slug === brands.find(b => b.id === selectedBrandFilter)?.slug
                      )
                      .slice(0, 10)
                      .map((rec) => {
                      const Icon = typeIcons[rec.type] || Sparkles
                      return (
                        <div
                          key={rec.id}
                          className="p-4 border rounded-lg hover:border-purple-200 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                              <Icon className="h-4 w-4 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm">{rec.title}</p>
                                <span
                                  className={cn(
                                    'text-xs px-2 py-0.5 rounded-full',
                                    priorityColors[rec.priority] || priorityColors.MEDIUM
                                  )}
                                >
                                  {rec.priority}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {rec.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                <span>{rec.brand.name}</span>
                                {rec.estimatedImpact && (
                                  <>
                                    <span>-</span>
                                    <span className="text-green-600">
                                      {rec.estimatedImpact}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recommendations yet</p>
                    <p className="text-sm mt-1">
                      Click "Generate New" to get AI-powered marketing
                      recommendations for your brands
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weekly Marketing Plan Link */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Weekly Marketing Plan
                </CardTitle>
                <CardDescription>
                  AI-generated weekly action plan for your brands
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" asChild>
                  <Link href="/ai/plans">
                    View Weekly Plans
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Chat */}
          <div>
            <Card className="h-[650px] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0">
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
                  {chatLoading && (
                    <div className="bg-muted p-3 rounded-lg max-w-[90%]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  )}
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
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    size="icon"
                    className="h-auto"
                    disabled={chatLoading || !chatInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    'Top 3 priorities this week',
                    'Content ideas for social media',
                    'How to improve SEO',
                  ].map((action) => (
                    <Button
                      key={action}
                      variant="outline"
                      size="sm"
                      onClick={() => setChatInput(action)}
                      disabled={chatLoading}
                    >
                      {action}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
