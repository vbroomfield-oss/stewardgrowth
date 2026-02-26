'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  Loader2,
  CheckCircle2,
  Rocket,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/use-toast'

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'brand', title: 'Create Brand' },
  { id: 'connect', title: 'Connect' },
  { id: 'ready', title: 'Ready' },
]

const brandTypes = [
  { id: 'saas', label: 'SaaS Product' },
  { id: 'ministry', label: 'Ministry' },
  { id: 'book', label: 'Book/Author' },
  { id: 'business', label: 'Business' },
  { id: 'other', label: 'Other' },
]

const socialPlatforms = [
  { id: 'twitter', label: 'Twitter/X', icon: Twitter },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [userName, setUserName] = useState('')
  const [saving, setSaving] = useState(false)
  const [brandCreated, setBrandCreated] = useState(false)

  // Brand form
  const [brandName, setBrandName] = useState('')
  const [brandType, setBrandType] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [website, setWebsite] = useState('')

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/user', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          if (data.user?.firstName) {
            setUserName(data.user.firstName)
          }
        }
      } catch {
        // ignore
      }
    }
    fetchUser()
  }, [])

  const handleCreateBrand = async () => {
    if (!brandName) {
      toast({ title: 'Brand name is required', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const slug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: brandName,
          slug,
          domain: website || undefined,
          brandVoice: { tone: 'professional', personality: brandType || 'business' },
          targetAudiences: [],
          goals: { description },
          budgetConstraints: {},
          approvalRules: {},
          settings: { category, type: brandType },
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create brand')
      }

      setBrandCreated(true)
      toast({ title: 'Brand created successfully!' })
      setStep(2)
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleConnect = (platformId: string) => {
    window.open(`/api/oauth/${platformId}/authorize`, '_blank')
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="w-full mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  i <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {i < step ? <CheckCircle2 className="h-5 w-5" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 w-16 md:w-24 mx-2 transition-colors',
                    i < step ? 'bg-primary' : 'bg-muted'
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          {STEPS.map((s) => (
            <span key={s.id}>{s.title}</span>
          ))}
        </div>
      </div>

      {/* Step 1: Welcome */}
      {step === 0 && (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-6">
            <div className="rounded-full bg-primary/10 p-6">
              <Sparkles className="h-12 w-12 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">
              Welcome{userName ? `, ${userName}` : ''}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-md">
              StewardGrowth is your AI-powered marketing command center.
              Manage all your brands, generate content, track analytics,
              and grow your business from one dashboard.
            </p>
            <p className="text-muted-foreground">
              Let&apos;s set up your first brand to get started.
            </p>
            <Button size="lg" onClick={() => setStep(1)}>
              Let&apos;s Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Create Brand */}
      {step === 1 && (
        <Card className="w-full">
          <CardContent className="py-8 space-y-6">
            <div className="text-center space-y-2">
              <Building2 className="h-8 w-8 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Create Your First Brand</h2>
              <p className="text-muted-foreground">
                Tell us about the product or business you want to market
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  placeholder="e.g. StewardPro"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                />
              </div>

              <div>
                <Label>Brand Type</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {brandTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setBrandType(type.id)}
                      className={cn(
                        'px-3 py-2 border rounded-lg text-sm transition-colors',
                        brandType === type.id
                          ? 'border-primary bg-primary/10 font-medium'
                          : 'hover:border-gray-400'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="category">Industry / Category</Label>
                <Input
                  id="category"
                  placeholder="e.g. Church Management, B2B SaaS, E-commerce"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="description">One Sentence Description</Label>
                <Textarea
                  id="description"
                  placeholder="e.g. Church management software that helps ministries grow"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="website">Website URL</Label>
                <Input
                  id="website"
                  placeholder="https://yourbrand.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleCreateBrand} disabled={!brandName || saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Brand
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Connect Social */}
      {step === 2 && (
        <Card className="w-full">
          <CardContent className="py-8 space-y-6">
            <div className="text-center space-y-2">
              <Globe className="h-8 w-8 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">Connect a Social Platform</h2>
              <p className="text-muted-foreground">
                Connect your social accounts to publish AI-generated content directly
              </p>
            </div>

            <div className="space-y-3">
              {socialPlatforms.map((platform) => {
                const Icon = platform.icon
                return (
                  <button
                    key={platform.id}
                    onClick={() => handleConnect(platform.id)}
                    className="w-full flex items-center justify-between p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{platform.label}</span>
                    </div>
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => setStep(3)}>
                  Skip for now
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Ready */}
      {step === 3 && (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center text-center py-12 space-y-6">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
              <Rocket className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-3xl font-bold">You&apos;re All Set!</h2>
            <p className="text-lg text-muted-foreground max-w-md">
              Your brand is ready. Generate your first piece of AI-powered content
              or explore the dashboard.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Button size="lg" className="flex-1" asChild>
                <Link href="/content/create">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Content
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="flex-1" asChild>
                <Link href="/">
                  Go to Dashboard
                </Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground pt-4">
              You can always connect more platforms and manage your brand in{' '}
              <Link href="/settings" className="text-primary hover:underline">Settings</Link>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
