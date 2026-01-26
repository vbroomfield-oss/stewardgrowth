'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Globe,
  Target,
  Palette,
  CheckCircle,
  Copy,
  Code,
  Megaphone,
  DollarSign,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { id: 'basics', title: 'Basics', icon: Building2 },
  { id: 'domains', title: 'Domains', icon: Globe },
  { id: 'brand', title: 'Brand Voice', icon: Palette },
  { id: 'audiences', title: 'Audiences', icon: Users },
  { id: 'budget', title: 'Budget', icon: DollarSign },
  { id: 'tracking', title: 'Tracking', icon: Code },
]

export default function NewBrandPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

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

    // Tracking (auto-generated)
    apiKey: `sg_${Math.random().toString(36).substring(2, 15)}`,
    trackingId: `SG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
  })

  const updateForm = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    // In production: API call to save brand
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
    router.push('/brands')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const trackingSnippet = `<!-- StewardGrowth Tracking for ${formData.name || 'Your Brand'} -->
<script>
  (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'sg.start':
  new Date().getTime(),event:'sg.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://growth.steward.tech/sdk/sg.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','sgLayer','${formData.trackingId}');

  // Optional: Identify user when they log in
  // sgLayer.push({
  //   event: 'identify',
  //   userId: 'user-123',
  //   email: 'user@example.com'
  // });
</script>`

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
            Onboard a SaaS product for marketing automation
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentStep
          const isComplete = index < currentStep

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(index)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  isActive && 'bg-primary text-primary-foreground',
                  isComplete && 'bg-green-100 text-green-700 dark:bg-green-900/30',
                  !isActive && !isComplete && 'bg-muted text-muted-foreground'
                )}
              >
                {isComplete ? (
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
                      updateForm('slug', e.target.value.toLowerCase().replace(/\s+/g, ''))
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Slug</label>
                  <Input
                    placeholder="stewardpro"
                    value={formData.slug}
                    onChange={(e) => updateForm('slug', e.target.value)}
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
                  <option value="church_software">Church Software</option>
                  <option value="b2b_saas">B2B SaaS</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="education">Education</option>
                  <option value="nonprofit">Nonprofit</option>
                  <option value="professional_services">Professional Services</option>
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
                Install this code on your product to start tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Tracking ID</p>
                  <p className="text-xl font-mono font-bold">{formData.trackingId}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">API Key</p>
                  <p className="text-xl font-mono font-bold">{formData.apiKey}</p>
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
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
                  {trackingSnippet}
                </pre>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">Installation Instructions</h4>
                <ol className="text-sm text-green-600 dark:text-green-300 space-y-2 list-decimal list-inside">
                  <li>Copy the tracking snippet above</li>
                  <li>Paste it in the <code className="bg-green-100 dark:bg-green-900/50 px-1 rounded">&lt;head&gt;</code> section of your product</li>
                  <li>Install on ALL domains: {formData.primaryDomain}, {formData.appDomain}, {formData.marketingSite}</li>
                  <li>Events will start flowing within minutes</li>
                </ol>
              </div>

              <div className="pt-4">
                <h4 className="font-medium mb-2">Optional: Track Custom Events</h4>
                <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg text-xs overflow-x-auto">
{`// Track a signup
sgLayer.push({
  event: 'signup_completed',
  userId: user.id,
  email: user.email,
  plan: 'trial'
});

// Track a purchase
sgLayer.push({
  event: 'subscription_started',
  userId: user.id,
  revenue: 99,
  currency: 'USD',
  plan: 'pro'
});`}
                </pre>
              </div>
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <div className="p-6 border-t flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Brand'}
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
