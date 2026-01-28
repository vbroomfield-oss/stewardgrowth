'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Palette,
  CheckCircle,
  Copy,
  Code,
  DollarSign,
  Users,
  AlertCircle,
  Loader2,
  Sparkles,
  MessageSquare,
  LayoutTemplate,
  ListChecks,
  Zap,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

// Onboarding modes
type OnboardingMode = 'select' | 'ai-chat' | 'template' | 'manual'

// Industry templates available
const industryOptions = [
  { id: 'church-management', name: 'Church Software', icon: '⛪' },
  { id: 'saas-b2b', name: 'B2B SaaS', icon: '🏢' },
  { id: 'saas-b2c', name: 'B2C Apps', icon: '📱' },
  { id: 'ecommerce', name: 'E-commerce', icon: '🛒' },
  { id: 'healthcare', name: 'Healthcare Tech', icon: '🏥' },
  { id: 'fintech', name: 'Fintech', icon: '💳' },
  { id: 'education', name: 'Education Tech', icon: '📚' },
]

const steps = [
  { id: 'basics', title: 'Basics', icon: Building2 },
  { id: 'domains', title: 'Domains', icon: Globe },
  { id: 'brand', title: 'Brand Voice', icon: Palette },
  { id: 'audiences', title: 'Audiences', icon: Users },
  { id: 'budget', title: 'Budget', icon: DollarSign },
  { id: 'tracking', title: 'Tracking', icon: Code },
]

interface RecommendedPlan {
  name: string
  price: number
  features: string[]
  reason: string
}

export default function NewBrandPage() {
  const router = useRouter()
  const { toast } = useToast()

  // Onboarding mode state
  const [mode, setMode] = useState<OnboardingMode>('select')
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'ai'; content: string }>>([])
  const [chatInput, setChatInput] = useState('')
  const [isAiThinking, setIsAiThinking] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<any>(null)

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendedPlan, setRecommendedPlan] = useState<RecommendedPlan | null>(null)

  const [formData, setFormData] = useState({
    // Basics
    name: '',
    slug: '',
    description: '',
    industry: '',

    // Domains
    primaryDomain: '',
    appDomain: '',
    marketingSite: '',
    landingPages: [''],

    // Brand Voice
    tone: 'professional',
    personality: '',
    tagline: '',
    keywords: '',
    avoidWords: '',

    // Audiences
    audiences: [
      { name: '', role: '', painPoints: '', goals: '' },
    ],

    // Budget
    monthlyBudget: '',
    dailyMax: '',
    googleBudget: '',
    metaBudget: '',
    linkedinBudget: '',

    // Tracking (will be set from API response)
    apiKey: '',
    trackingId: '',
  })

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle AI chat submission
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return

    const userMessage = chatInput.trim()
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setChatInput('')
    setIsAiThinking(true)

    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'suggest',
          data: { description: userMessage },
        }),
      })

      const result = await response.json()

      if (result.suggestions) {
        setAiSuggestions(result.suggestions)
        const s = result.suggestions

        // Update form with all suggestions
        if (s.suggestedName) {
          updateForm('name', s.suggestedName)
        }
        if (s.suggestedSlug) {
          updateForm('slug', s.suggestedSlug)
        } else if (s.suggestedName) {
          updateForm('slug', s.suggestedName.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        }
        if (s.suggestedDescription) {
          updateForm('description', s.suggestedDescription)
        }
        updateForm('tagline', s.suggestedTagline || '')
        updateForm('industry', s.suggestedIndustry || '')

        // Domains
        if (s.primaryDomain) updateForm('primaryDomain', s.primaryDomain)
        if (s.appDomain) updateForm('appDomain', s.appDomain)
        if (s.marketingSite) updateForm('marketingSite', s.marketingSite)

        // Brand voice
        if (s.brandVoice) {
          updateForm('tone', s.brandVoice.tone?.[0]?.toLowerCase() || 'professional')
          updateForm('keywords', s.brandVoice.keywords?.join(', ') || '')
          updateForm('avoidWords', s.brandVoice.avoid?.join(', ') || '')
        }

        // Target audiences - handle both string array and object array formats
        if (s.targetAudiences && Array.isArray(s.targetAudiences)) {
          if (typeof s.targetAudiences[0] === 'string') {
            updateForm('audiences', s.targetAudiences.map((a: string) => ({
              name: a,
              role: '',
              painPoints: '',
              goals: '',
            })))
          } else {
            // Already formatted as objects with name, role, painPoints, goals
            updateForm('audiences', s.targetAudiences)
          }
        }

        // Budget
        if (s.monthlyBudget) {
          updateForm('monthlyBudget', s.monthlyBudget.toString())
        }

        if (s.recommendedPlan) {
          setRecommendedPlan(s.recommendedPlan)
        }

        // Build AI response message
        let aiResponse = "Based on your description, I've set up your brand profile:\n\n"
        aiResponse += `• **Name**: ${s.suggestedName || 'Not detected'}\n`
        aiResponse += `• **Industry**: ${s.suggestedIndustry?.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'General SaaS'}\n`
        aiResponse += `• **Tagline**: "${s.suggestedTagline || 'Not set'}"\n`
        if (s.primaryDomain) aiResponse += `• **Domain**: ${s.primaryDomain}\n`
        const audienceNames = s.targetAudiences?.map((a: any) => typeof a === 'string' ? a : a.name) || []
        aiResponse += `• **Target Audiences**: ${audienceNames.join(', ') || 'Not set'}\n`
        aiResponse += `• **Tone**: ${s.brandVoice?.tone?.join(', ') || 'Professional'}\n`
        if (s.monthlyBudget) aiResponse += `• **Monthly Budget**: $${s.monthlyBudget}\n`
        aiResponse += "\nI've pre-filled ALL wizard fields with these settings. Click **Continue to Wizard** to review and make any adjustments."

        setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }])
      }
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: "I had trouble processing that. Could you try describing your product again?"
      }])
    } finally {
      setIsAiThinking(false)
    }
  }

  // Handle template selection
  const handleTemplateSelect = async (templateId: string) => {
    setSelectedIndustry(templateId)
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'template',
          data: { industry: templateId },
        }),
      })

      const result = await response.json()

      if (result.template) {
        const t = result.template
        updateForm('tagline', t.tagline || '')
        updateForm('industry', templateId)
        updateForm('tone', t.brandVoice?.tone?.[0]?.toLowerCase() || 'professional')
        updateForm('keywords', t.brandVoice?.keywords?.join(', ') || '')
        updateForm('avoidWords', t.brandVoice?.avoid?.join(', ') || '')
        updateForm('audiences', t.targetAudiences?.map((a: string) => ({
          name: a,
          role: '',
          painPoints: '',
          goals: '',
        })) || [{ name: '', role: '', painPoints: '', goals: '' }])
        updateForm('monthlyBudget', t.suggestedBudget?.monthly?.toString() || '')

        if (t.recommendedPlan) {
          setRecommendedPlan(t.recommendedPlan)
        }

        setMode('manual')
      }
    } catch (err) {
      toast({
        title: 'Error loading template',
        description: 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleNext = async () => {
    // Validate current step before moving forward
    if (currentStep === 0) {
      if (!formData.name.trim()) {
        setError('Product name is required')
        return
      }
      if (!formData.slug.trim()) {
        setError('Slug is required')
        return
      }
    }

    setError(null)

    // On step 5 (budget), save to database and get tracking credentials
    if (currentStep === 4 && !isSaved) {
      await saveBrand()
    } else if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    setError(null)
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const saveBrand = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          industry: formData.industry,
          primaryDomain: formData.primaryDomain,
          appDomain: formData.appDomain,
          marketingSite: formData.marketingSite,
          landingPages: formData.landingPages.filter(lp => lp.trim()),
          tone: formData.tone,
          personality: formData.personality,
          tagline: formData.tagline,
          keywords: formData.keywords,
          avoidWords: formData.avoidWords,
          audiences: formData.audiences.filter(a => a.name.trim()),
          monthlyBudget: formData.monthlyBudget,
          dailyMax: formData.dailyMax,
          googleBudget: formData.googleBudget,
          metaBudget: formData.metaBudget,
          linkedinBudget: formData.linkedinBudget,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create brand')
      }

      // Update form with tracking credentials from server
      setFormData(prev => ({
        ...prev,
        apiKey: result.data.apiKey,
        trackingId: result.data.trackingId,
      }))

      setIsSaved(true)
      setCurrentStep(5) // Move to tracking step

      toast({
        title: 'Brand created successfully!',
        description: 'Your tracking credentials are ready.',
      })
    } catch (err: any) {
      setError(err.message || 'Failed to create brand. Please try again.')
      toast({
        title: 'Error creating brand',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleFinish = () => {
    router.push(`/brands/${formData.slug}`)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast({
      title: 'Copied to clipboard',
      description: 'Tracking snippet copied successfully.',
    })
    setTimeout(() => setCopied(false), 2000)
  }

  // Simple tracking snippet that posts directly to our API
  const trackingSnippet = `<!-- StewardGrowth Tracking for ${formData.name || 'Your Brand'} -->
<script>
(function() {
  var SG_TRACKING_ID = '${formData.trackingId}';
  var SG_API_KEY = '${formData.apiKey}';
  var SG_ENDPOINT = '${typeof window !== 'undefined' ? window.location.origin : ''}/api/events/ingest';

  // Get UTM parameters from URL
  function getUtmParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content')
    };
  }

  // Get or create visitor ID
  function getVisitorId() {
    var vid = localStorage.getItem('sg_visitor_id');
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      localStorage.setItem('sg_visitor_id', vid);
    }
    return vid;
  }

  // Get or create session ID
  function getSessionId() {
    var sid = sessionStorage.getItem('sg_session_id');
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
      sessionStorage.setItem('sg_session_id', sid);
    }
    return sid;
  }

  // Send event to StewardGrowth
  window.sgTrack = function(eventName, properties) {
    var utm = getUtmParams();
    var data = {
      brandId: SG_TRACKING_ID,
      eventType: eventName,
      timestamp: new Date().toISOString(),
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      url: window.location.href,
      referrer: document.referrer,
      utmSource: utm.utm_source,
      utmMedium: utm.utm_medium,
      utmCampaign: utm.utm_campaign,
      utmTerm: utm.utm_term,
      utmContent: utm.utm_content,
      properties: properties || {}
    };

    fetch(SG_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SG_API_KEY
      },
      body: JSON.stringify(data)
    }).catch(function() {});
  };

  // Identify user
  window.sgIdentify = function(userId, traits) {
    localStorage.setItem('sg_user_id', userId);
    sgTrack('identify', { userId: userId, ...traits });
  };

  // Auto-track page view
  sgTrack('page_view', { title: document.title });
})();
</script>`

  // Mode selection screen
  if (mode === 'select') {
    return (
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/brands">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Brand</h1>
            <p className="text-muted-foreground">
              Choose how you&apos;d like to set up your brand
            </p>
          </div>
        </div>

        {/* Onboarding Options */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* AI Chat Option */}
          <Card
            className="cursor-pointer hover:border-purple-500 transition-all hover:shadow-lg"
            onClick={() => {
              setMode('ai-chat')
              setChatMessages([{
                role: 'ai',
                content: "Hi! I'm here to help you set up your brand. Just tell me about your product in a few sentences, and I'll configure everything for you.\n\nFor example: \"We make church management software that helps pastors manage their congregation, track donations, and schedule events.\""
              }])
            }}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 p-4 mb-2">
                <MessageSquare className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                AI Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Describe your product and let AI configure everything. Perfect for quick setup.
              </p>
              <p className="text-xs text-purple-600 mt-2 font-medium">Recommended</p>
            </CardContent>
          </Card>

          {/* Template Option */}
          <Card
            className="cursor-pointer hover:border-blue-500 transition-all hover:shadow-lg"
            onClick={() => setMode('template')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mb-2">
                <LayoutTemplate className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Industry Template</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Start with pre-configured settings for your industry. Easy to customize.
              </p>
              <p className="text-xs text-blue-600 mt-2 font-medium">7 templates available</p>
            </CardContent>
          </Card>

          {/* Manual Option */}
          <Card
            className="cursor-pointer hover:border-green-500 transition-all hover:shadow-lg"
            onClick={() => setMode('manual')}
          >
            <CardHeader className="text-center pb-2">
              <div className="mx-auto rounded-full bg-green-100 dark:bg-green-900/30 p-4 mb-2">
                <ListChecks className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle>Step-by-Step</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Configure everything manually with full control over all settings.
              </p>
              <p className="text-xs text-green-600 mt-2 font-medium">6 steps</p>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="bg-muted/50">
          <CardContent className="p-4 flex items-start gap-3">
            <Zap className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Not sure which to choose?</p>
              <p className="text-sm text-muted-foreground">
                Start with the AI Assistant - it&apos;ll ask you a few questions and set up your brand in under a minute.
                You can always adjust settings later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // AI Chat mode
  if (mode === 'ai-chat') {
    return (
      <div className="max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setMode('select')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-purple-500" />
              AI Brand Setup
            </h1>
            <p className="text-muted-foreground">
              Tell me about your product
            </p>
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="min-h-[400px] flex flex-col">
          <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[400px]">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  'flex gap-3',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'ai' && (
                  <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-lg p-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            {isAiThinking && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 text-purple-600 animate-spin" />
                </div>
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm text-muted-foreground">Analyzing your product...</p>
                </div>
              </div>
            )}
          </CardContent>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Textarea
                placeholder="Describe your product here..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleChatSubmit()
                  }
                }}
                rows={2}
                className="resize-none"
              />
              <Button
                onClick={handleChatSubmit}
                disabled={!chatInput.trim() || isAiThinking}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>

        {/* Continue button when we have suggestions */}
        {aiSuggestions && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setMode('select')}>
              Start Over
            </Button>
            <Button onClick={() => setMode('manual')} className="flex-1">
              Continue to Wizard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Recommended Plan Preview */}
        {recommendedPlan && (
          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Recommended Plan: {recommendedPlan.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{recommendedPlan.reason}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">${recommendedPlan.price}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {recommendedPlan.features.slice(0, 3).map((f, i) => (
                  <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                    {f}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Template selection mode
  if (mode === 'template') {
    return (
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setMode('select')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Choose Your Industry</h1>
            <p className="text-muted-foreground">
              Select a template to get started quickly
            </p>
          </div>
        </div>

        {/* Template Grid */}
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {industryOptions.map((industry) => (
            <Card
              key={industry.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                selectedIndustry === industry.id
                  ? 'border-blue-500 ring-2 ring-blue-500/20'
                  : 'hover:border-blue-300'
              )}
              onClick={() => !isLoading && handleTemplateSelect(industry.id)}
            >
              <CardContent className="p-6 text-center">
                <span className="text-4xl mb-3 block">{industry.icon}</span>
                <p className="font-medium">{industry.name}</p>
                {isLoading && selectedIndustry === industry.id && (
                  <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Click a template to pre-fill settings for your industry. You can customize everything afterward.
        </p>
      </div>
    )
  }

  // Manual wizard mode (existing flow with enhancements)
  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => currentStep === 0 && !isSaved ? setMode('select') : null} asChild={currentStep > 0 || isSaved}>
          {currentStep === 0 && !isSaved ? (
            <span><ArrowLeft className="h-4 w-4" /></span>
          ) : (
            <Link href="/brands">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Brand</h1>
          <p className="text-muted-foreground">
            {selectedIndustry
              ? `Using ${industryOptions.find(i => i.id === selectedIndustry)?.name || 'custom'} template`
              : aiSuggestions
              ? 'AI-assisted setup'
              : 'Step-by-step configuration'
            }
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isComplete = index < currentStep || (index === 5 && isSaved)

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => {
                  if (index < currentStep || (index === currentStep)) {
                    setCurrentStep(index)
                  }
                }}
                disabled={index > currentStep && !isSaved}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  isActive && 'bg-primary text-primary-foreground',
                  isComplete && !isActive && 'bg-green-100 text-green-700 dark:bg-green-900/30',
                  !isActive && !isComplete && 'bg-muted text-muted-foreground',
                  index > currentStep && !isSaved && 'opacity-50 cursor-not-allowed'
                )}
              >
                {isComplete && !isActive ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="hidden md:inline text-sm font-medium">{step.title}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn(
                  'w-8 h-0.5 mx-2',
                  index < currentStep ? 'bg-green-500' : 'bg-muted'
                )} />
              )}
            </div>
          )
        })}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <Card>
        {/* Step 1: Basics */}
        {currentStep === 0 && (
          <>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Tell us about your SaaS product</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Name *</label>
                  <Input
                    placeholder="e.g., StewardPro"
                    value={formData.name}
                    onChange={(e) => {
                      updateForm('name', e.target.value)
                      updateForm('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Slug *</label>
                  <Input
                    placeholder="stewardpro"
                    value={formData.slug}
                    onChange={(e) => updateForm('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used in URLs: /brands/{formData.slug || 'slug'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Description</label>
                <Textarea
                  placeholder="Briefly describe what your product does..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Industry</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.industry}
                  onChange={(e) => updateForm('industry', e.target.value)}
                >
                  <option value="">Select industry...</option>
                  <option value="church-management">Church Software</option>
                  <option value="saas-b2b">B2B SaaS</option>
                  <option value="saas-b2c">B2C Apps</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="fintech">Fintech</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 2: Domains */}
        {currentStep === 1 && (
          <>
            <CardHeader>
              <CardTitle>Domains & URLs</CardTitle>
              <CardDescription>
                Configure all domains associated with this product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Important:</strong> We&apos;ll track events from all these domains and attribute them correctly.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Primary Domain *</label>
                <Input
                  placeholder="e.g., stewardpro.app"
                  value={formData.primaryDomain}
                  onChange={(e) => updateForm('primaryDomain', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your main product domain
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">App Domain</label>
                <Input
                  placeholder="e.g., app.stewardpro.app"
                  value={formData.appDomain}
                  onChange={(e) => updateForm('appDomain', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Where users log in to your app (if different)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Marketing Website</label>
                <Input
                  placeholder="e.g., stewardpro.com or www.stewardpro.app"
                  value={formData.marketingSite}
                  onChange={(e) => updateForm('marketingSite', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your marketing/landing page site (if separate)
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Landing Page Domains</label>
                {formData.landingPages.map((lp, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <Input
                      placeholder="e.g., get.stewardpro.app"
                      value={lp}
                      onChange={(e) => {
                        const newLPs = [...formData.landingPages]
                        newLPs[i] = e.target.value
                        updateForm('landingPages', newLPs)
                      }}
                    />
                    {i === formData.landingPages.length - 1 && (
                      <Button
                        variant="outline"
                        onClick={() => updateForm('landingPages', [...formData.landingPages, ''])}
                      >
                        Add
                      </Button>
                    )}
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  Add any additional domains for landing pages or campaigns
                </p>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 3: Brand Voice */}
        {currentStep === 2 && (
          <>
            <CardHeader>
              <CardTitle>Brand Voice Profile</CardTitle>
              <CardDescription>
                Help our AI generate content that matches your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Tone</label>
                <div className="grid grid-cols-3 gap-2">
                  {['professional', 'friendly', 'authoritative', 'casual', 'technical', 'inspirational'].map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => updateForm('tone', tone)}
                      className={cn(
                        'px-4 py-2 rounded-lg border text-sm capitalize transition-colors',
                        formData.tone === tone
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input hover:bg-accent'
                      )}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Tagline</label>
                <Input
                  placeholder="e.g., Professional services made simple"
                  value={formData.tagline}
                  onChange={(e) => updateForm('tagline', e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Brand Personality</label>
                <Textarea
                  placeholder="Describe your brand's personality and how you want to be perceived..."
                  rows={3}
                  value={formData.personality}
                  onChange={(e) => updateForm('personality', e.target.value)}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Keywords to Use</label>
                  <Textarea
                    placeholder="productivity, efficiency, growth, streamlined..."
                    rows={2}
                    value={formData.keywords}
                    onChange={(e) => updateForm('keywords', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Words to Avoid</label>
                  <Textarea
                    placeholder="cheap, basic, simple..."
                    rows={2}
                    value={formData.avoidWords}
                    onChange={(e) => updateForm('avoidWords', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Target Audiences */}
        {currentStep === 3 && (
          <>
            <CardHeader>
              <CardTitle>Target Audiences</CardTitle>
              <CardDescription>
                Define who you&apos;re marketing to
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.audiences.map((audience, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Audience {i + 1}</span>
                    {formData.audiences.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newAudiences = formData.audiences.filter((_, idx) => idx !== i)
                          updateForm('audiences', newAudiences)
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    <Input
                      placeholder="Audience name (e.g., Church Admins)"
                      value={audience.name}
                      onChange={(e) => {
                        const newAudiences = [...formData.audiences]
                        newAudiences[i].name = e.target.value
                        updateForm('audiences', newAudiences)
                      }}
                    />
                    <Input
                      placeholder="Role/Title (e.g., Administrative Pastor)"
                      value={audience.role}
                      onChange={(e) => {
                        const newAudiences = [...formData.audiences]
                        newAudiences[i].role = e.target.value
                        updateForm('audiences', newAudiences)
                      }}
                    />
                  </div>
                  <Textarea
                    placeholder="Pain points they're trying to solve..."
                    rows={2}
                    value={audience.painPoints}
                    onChange={(e) => {
                      const newAudiences = [...formData.audiences]
                      newAudiences[i].painPoints = e.target.value
                      updateForm('audiences', newAudiences)
                    }}
                  />
                  <Textarea
                    placeholder="Goals they're trying to achieve..."
                    rows={2}
                    value={audience.goals}
                    onChange={(e) => {
                      const newAudiences = [...formData.audiences]
                      newAudiences[i].goals = e.target.value
                      updateForm('audiences', newAudiences)
                    }}
                  />
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() =>
                  updateForm('audiences', [...formData.audiences, { name: '', role: '', painPoints: '', goals: '' }])
                }
              >
                Add Another Audience
              </Button>
            </CardContent>
          </>
        )}

        {/* Step 5: Budget */}
        {currentStep === 4 && (
          <>
            <CardHeader>
              <CardTitle>Budget & Constraints</CardTitle>
              <CardDescription>
                Set spending limits for AI recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recommended Plan (if available) */}
              {recommendedPlan && (
                <Card className="border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-purple-500" />
                      Recommended Plan: {recommendedPlan.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">{recommendedPlan.reason}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-2xl font-bold">${recommendedPlan.price}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recommendedPlan.features.map((f, i) => (
                        <span key={i} className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                          {f}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  AI will respect these limits when making budget recommendations. You can always adjust later.
                </p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Monthly Budget ($)</label>
                  <Input
                    type="number"
                    placeholder="5000"
                    value={formData.monthlyBudget}
                    onChange={(e) => updateForm('monthlyBudget', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Daily Max ($)</label>
                  <Input
                    type="number"
                    placeholder="200"
                    value={formData.dailyMax}
                    onChange={(e) => updateForm('dailyMax', e.target.value)}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm font-medium mb-3">Platform Allocation (optional)</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Google Ads</label>
                    <Input
                      type="number"
                      placeholder="2000"
                      value={formData.googleBudget}
                      onChange={(e) => updateForm('googleBudget', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Meta Ads</label>
                    <Input
                      type="number"
                      placeholder="1500"
                      value={formData.metaBudget}
                      onChange={(e) => updateForm('metaBudget', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">LinkedIn Ads</label>
                    <Input
                      type="number"
                      placeholder="500"
                      value={formData.linkedinBudget}
                      onChange={(e) => updateForm('linkedinBudget', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 6: Tracking */}
        {currentStep === 5 && (
          <>
            <CardHeader>
              <CardTitle>Event Tracking Setup</CardTitle>
              <CardDescription>
                {isSaved
                  ? 'Your brand has been created! Install this code on your product to start tracking.'
                  : 'Complete the previous steps to get your tracking code.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isSaved ? (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-700 dark:text-green-400">Brand Created Successfully!</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-300">
                      Your tracking credentials are ready. Copy the snippet below and add it to your website.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Tracking ID</p>
                      <p className="text-xl font-mono font-bold">{formData.trackingId}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">API Key</p>
                      <p className="text-sm font-mono font-bold break-all">{formData.apiKey}</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Tracking Snippet</label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(trackingSnippet)}
                      >
                        <Copy className="mr-2 h-3 w-3" />
                        {copied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto max-h-64">
                      {trackingSnippet}
                    </pre>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-medium text-blue-700 dark:text-blue-400 mb-2">Installation Instructions</h4>
                    <ol className="text-sm text-blue-600 dark:text-blue-300 space-y-2 list-decimal list-inside">
                      <li>Copy the tracking snippet above</li>
                      <li>Paste it in the <code className="bg-blue-100 dark:bg-blue-900/50 px-1 rounded">&lt;head&gt;</code> section of your product</li>
                      <li>Install on ALL domains: {formData.primaryDomain || 'your main domain'}{formData.appDomain && `, ${formData.appDomain}`}{formData.marketingSite && `, ${formData.marketingSite}`}</li>
                      <li>Events will start flowing immediately</li>
                    </ol>
                  </div>

                  <div className="pt-4">
                    <h4 className="font-medium mb-2">Track Custom Events</h4>
                    <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`// Track a signup
sgTrack('signup_completed', { plan: 'trial' });

// Identify a user when they log in
sgIdentify('user_123', { email: 'user@example.com', name: 'John Doe' });

// Track a purchase
sgTrack('subscription_started', { plan: 'pro', revenue: 99, currency: 'USD' });`}
                    </pre>
                  </div>
                </>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <Code className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Complete the budget step to generate your tracking credentials.</p>
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <div className="p-6 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0 || isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Brand...
                </>
              ) : currentStep === 4 ? (
                <>
                  Create Brand & Get Code
                  <CheckCircle className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleFinish}>
              View Brand Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
