import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateBlogPost,
  generateSocialPost,
  generateAdCopy,
  generateEmail,
  generateContentIdeas,
  type ContentGenerationOptions,
  type BrandVoice,
} from '@/lib/ai/openai'

// Default brand voices for Steward products
const BRAND_VOICES: Record<string, BrandVoice> = {
  stewardmax: {
    personality: ['helpful', 'professional', 'warm', 'trustworthy'],
    doSay: [
      'ministry management',
      'church growth',
      'streamline',
      'community',
      'stewardship',
      'empower',
    ],
    dontSay: [
      'cheap',
      'basic',
      'just',
      'simple software',
      'competitor names',
    ],
    valuePropositions: [
      'All-in-one church management',
      'Built for ministry, not business',
      'Affordable for churches of all sizes',
      'Integrates with what you already use',
    ],
    targetAudience: 'Church administrators, pastors, ministry leaders',
    industry: 'church_software',
  },
  stewardring: {
    personality: ['modern', 'reliable', 'professional', 'innovative'],
    doSay: [
      'cloud-based',
      'crystal clear',
      'always connected',
      'seamless',
      'reliable',
    ],
    dontSay: [
      'old-fashioned',
      'landline',
      'complicated',
    ],
    valuePropositions: [
      'Cloud phone system built for churches',
      'Connect your congregation anywhere',
      'Integrated with StewardMAX',
      'Save up to 60% on phone costs',
    ],
    targetAudience: 'Church administrators, office managers, IT decision makers',
    industry: 'church_software',
  },
}

/**
 * POST /api/content/generate
 *
 * Generate AI content for various platforms and types.
 *
 * Body:
 * {
 *   "type": "blog" | "social" | "ad" | "email" | "ideas",
 *   "brandId": "stewardmax",
 *   "topic": "...",
 *   "platform"?: "twitter" | "linkedin" | "facebook" | "instagram" | "google" | "meta",
 *   "options"?: ContentGenerationOptions
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type,
      brandId,
      topic,
      platform,
      objective,
      emailType,
      count,
      options = {},
    } = body

    if (!type || !brandId || !topic) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, brandId, topic' },
        { status: 400 }
      )
    }

    // Get brand voice
    const brandVoice = BRAND_VOICES[brandId.toLowerCase()]

    const generationOptions: ContentGenerationOptions = {
      brandName: brandId,
      brandVoice,
      ...options,
    }

    let result

    switch (type) {
      case 'blog':
        result = await generateBlogPost(topic, generationOptions)
        break

      case 'social':
        if (!platform || !['twitter', 'linkedin', 'facebook', 'instagram'].includes(platform)) {
          return NextResponse.json(
            { success: false, error: 'Valid platform required for social content' },
            { status: 400 }
          )
        }
        result = await generateSocialPost(platform, topic, generationOptions)
        break

      case 'ad':
        if (!platform || !['google', 'meta', 'linkedin', 'tiktok'].includes(platform)) {
          return NextResponse.json(
            { success: false, error: 'Valid platform required for ad content' },
            { status: 400 }
          )
        }
        result = await generateAdCopy(
          platform,
          objective || 'consideration',
          topic,
          generationOptions
        )
        break

      case 'email':
        result = await generateEmail(
          emailType || 'newsletter',
          topic,
          generationOptions
        )
        break

      case 'ideas':
        result = await generateContentIdeas(
          platform || 'blog',
          topic,
          count || 10,
          generationOptions
        )
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid content type' },
          { status: 400 }
        )
    }

    // Log generation for tracking
    // In production: Save to database for audit trail

    return NextResponse.json({
      success: true,
      data: {
        type,
        brandId,
        topic,
        platform,
        generatedAt: new Date().toISOString(),
        ...result,
      },
    })
  } catch (error) {
    console.error('Content generation error:', error)

    // Check if it's an OpenAI API error
    if (error instanceof Error && error.message.includes('API')) {
      return NextResponse.json(
        { success: false, error: 'AI service temporarily unavailable' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}
