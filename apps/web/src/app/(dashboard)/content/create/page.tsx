'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ArrowLeft,
  Sparkles,
  Loader2,
  Copy,
  RefreshCw,
  Save,
  Send,
  FileText,
  Twitter,
  Linkedin,
  Facebook,
  Instagram,
  Mail,
  Target,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type ContentType = 'blog' | 'social' | 'email' | 'ad'
type Platform = 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'google' | 'meta'

interface Brand {
  id: string
  name: string
  slug: string
}

const contentTypes = [
  { id: 'blog', label: 'Blog Post', icon: FileText, description: 'Long-form SEO content' },
  { id: 'social', label: 'Social Media', icon: Twitter, description: 'Posts for all platforms' },
  { id: 'email', label: 'Email', icon: Mail, description: 'Newsletters & campaigns' },
  { id: 'ad', label: 'Ad Copy', icon: Target, description: 'Google, Meta, LinkedIn ads' },
]

const socialPlatforms = [
  { id: 'twitter', label: 'Twitter/X', icon: Twitter },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
]

const adPlatforms = [
  { id: 'google', label: 'Google Ads', icon: Target },
  { id: 'meta', label: 'Meta Ads', icon: Target },
  { id: 'linkedin', label: 'LinkedIn Ads', icon: Linkedin },
]

function CreateContentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialType = searchParams.get('type') as ContentType || null

  const [brands, setBrands] = useState<Brand[]>([])
  const [loadingBrands, setLoadingBrands] = useState(true)
  const [contentType, setContentType] = useState<ContentType | null>(initialType)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [brand, setBrand] = useState('')
  const [topic, setTopic] = useState('')
  const [keywords, setKeywords] = useState('')
  const [tone, setTone] = useState('professional')
  const [cta, setCta] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generatedContent, setGeneratedContent] = useState<string | null>(null)
  const [alternates, setAlternates] = useState<string[]>([])

  useEffect(() => {
    async function fetchBrands() {
      try {
        const res = await fetch('/api/brands', { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const fetchedBrands = data.brands || []
          setBrands(fetchedBrands)
          // Set default brand if available
          if (fetchedBrands.length > 0 && !brand) {
            setBrand(fetchedBrands[0].id)
          }
        }
      } catch (err) {
        console.error('Failed to load brands:', err)
      } finally {
        setLoadingBrands(false)
      }
    }
    fetchBrands()
  }, [])

  const selectedBrand = brands.find(b => b.id === brand)

  const handleGenerate = async () => {
    if (!topic || !contentType || !brand) return

    setGenerating(true)
    setGeneratedContent(null)

    try {
      const response = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: contentType,
          brandId: brand,
          topic,
          platform,
          options: {
            tone,
            keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
            callToAction: cta,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        setGeneratedContent(data.data.content)
        setAlternates(data.data.alternates || [])
      } else {
        // Show error or fallback content
        setGeneratedContent(`Failed to generate content: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      setGeneratedContent('Failed to generate content. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSaveAsDraft = () => {
    alert('Content saved as draft!')
  }

  const handleSubmitForApproval = () => {
    alert('Content submitted for approval!')
    router.push('/approvals')
  }

  if (loadingBrands) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (brands.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/content">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Create Content</h1>
            <p className="text-muted-foreground">
              AI-powered content generation for all your marketing needs
            </p>
          </div>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-primary/10 p-4 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Brands Configured</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Add a brand first to start generating AI-powered marketing content.
            </p>
            <Button asChild size="lg">
              <Link href="/brands/new">Add Your First Brand</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/content">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Content</h1>
          <p className="text-muted-foreground">
            AI-powered content generation for all your marketing needs
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Input Form */}
        <div className="space-y-6">
          {/* Content Type Selection */}
          {!contentType && (
            <Card>
              <CardHeader>
                <CardTitle>What do you want to create?</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {contentTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.id}
                        onClick={() => setContentType(type.id as ContentType)}
                        className="p-4 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
                      >
                        <Icon className="h-6 w-6 mb-2 text-primary" />
                        <p className="font-medium">{type.label}</p>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Content Form */}
          {contentType && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="capitalize">{contentType} Content</span>
                  <Button variant="ghost" size="sm" onClick={() => setContentType(null)}>
                    Change Type
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Platform Selection for Social/Ads */}
                {(contentType === 'social' || contentType === 'ad') && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Platform</label>
                    <div className="flex flex-wrap gap-2">
                      {(contentType === 'social' ? socialPlatforms : adPlatforms).map((p) => {
                        const IconComponent = p.icon
                        return (
                          <button
                            key={p.id}
                            onClick={() => setPlatform(p.id as Platform)}
                            className={cn(
                              'px-3 py-2 border rounded-lg flex items-center gap-2 transition-colors',
                              platform === p.id
                                ? 'border-primary bg-primary/10'
                                : 'hover:border-gray-400'
                            )}
                          >
                            <IconComponent className="h-4 w-4" />
                            {p.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Brand Selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Brand</label>
                  <select
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                {/* Topic */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Topic / Subject</label>
                  <Textarea
                    placeholder="What should this content be about?"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Keywords */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Keywords (comma-separated)
                  </label>
                  <Input
                    placeholder="marketing, growth, SaaS, ..."
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                  />
                </div>

                {/* Tone */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800"
                  >
                    <option value="professional">Professional</option>
                    <option value="friendly">Friendly</option>
                    <option value="inspirational">Inspirational</option>
                    <option value="educational">Educational</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* CTA */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Call to Action</label>
                  <Input
                    placeholder="Start your free trial"
                    value={cta}
                    onChange={(e) => setCta(e.target.value)}
                  />
                </div>

                {/* Generate Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleGenerate}
                  disabled={!topic || !brand || generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Preview */}
        <div className="space-y-4">
          <Card className="min-h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Content</span>
                {generatedContent && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Regenerate
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(generatedContent)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedContent ? (
                <div className="prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
                    {generatedContent}
                  </pre>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Sparkles className="h-12 w-12 mb-4 opacity-50" />
                  <p>Your AI-generated content will appear here</p>
                  <p className="text-sm">Fill out the form and click Generate</p>
                </div>
              )}

              {/* Alternates */}
              {alternates.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Alternative Versions</h4>
                  {alternates.map((alt, i) => (
                    <div key={i} className="p-3 bg-muted rounded-lg text-sm">
                      {alt}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          {generatedContent && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleSaveAsDraft}>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </Button>
              <Button className="flex-1" onClick={handleSubmitForApproval}>
                <Send className="mr-2 h-4 w-4" />
                Submit for Approval
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function CreateContentPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <CreateContentPageContent />
    </Suspense>
  )
}
