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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Brand {
  id: string
  name: string
  slug: string
}

export default function AIPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'ai'; message: string }>>([
    { role: 'ai', message: 'Hi! I\'m your AI Marketing Assistant. I can help you analyze campaigns, suggest optimizations, generate content ideas, or answer questions about your marketing performance. What would you like to know?' },
  ])

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands')
        if (res.ok) {
          const data = await res.json()
          setBrands(data.brands || [])
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchBrands()
  }, [])

  const handleSendMessage = () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput
    setChatInput('')
    setChatHistory(prev => [...prev, { role: 'user', message: userMessage }])

    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, {
        role: 'ai',
        message: brands.length === 0
          ? `I'd love to help you with "${userMessage}", but you need to add a brand first. Once you have brands configured with tracking data, I can provide insights, recommendations, and help you optimize your marketing.`
          : `I can help you with "${userMessage}". As you collect more event data and configure your brands, I'll be able to provide specific insights and recommendations for your marketing campaigns.`,
      }])
    }, 1000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
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

      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-purple-500/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand to unlock AI-powered recommendations, campaign optimization suggestions, and marketing insights.
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
            {/* AI Recommendations - Empty State */}
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
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recommendations yet</p>
                  <p className="text-sm mt-1">
                    AI recommendations will appear as you collect more event data
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Marketing Plan - Empty State */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-500" />
                  Weekly Marketing Plan
                </CardTitle>
                <CardDescription>AI-generated weekly action plan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No plan generated yet</p>
                  <p className="text-sm mt-1">
                    Weekly plans will be generated based on your brand data and goals
                  </p>
                  <Button variant="outline" className="mt-4" asChild>
                    <Link href="/ai/plans">View Weekly Plans</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Chat */}
          <div>
            <Card className="h-[600px] flex flex-col">
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
      )}
    </div>
  )
}
