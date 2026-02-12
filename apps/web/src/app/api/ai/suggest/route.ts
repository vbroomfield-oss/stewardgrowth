import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import Anthropic from '@anthropic-ai/sdk'

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Industry templates with pre-filled data
const industryTemplates: Record<string, {
  name: string
  tagline: string
  targetAudiences: string[]
  brandVoice: {
    tone: string[]
    keywords: string[]
    avoid: string[]
  }
  suggestedBudget: {
    monthly: number
    adSpend: number
  }
  recommendedPlan: {
    name: string
    price: number
    features: string[]
    reason: string
  }
}> = {
  'church-management': {
    name: '',
    tagline: 'Empowering churches to focus on ministry',
    targetAudiences: ['Church administrators', 'Pastors and ministry leaders', 'Church volunteers'],
    brandVoice: {
      tone: ['Warm', 'Supportive', 'Professional'],
      keywords: ['ministry', 'congregation', 'community', 'stewardship', 'faith'],
      avoid: ['salesy language', 'pressure tactics', 'overly technical jargon'],
    },
    suggestedBudget: {
      monthly: 2000,
      adSpend: 1500,
    },
    recommendedPlan: {
      name: 'Growth',
      price: 199,
      features: ['Unlimited content generation', 'SEO optimization', 'Ad campaign management', 'Analytics dashboard'],
      reason: 'Best for church software brands looking to expand reach through content marketing and targeted ads.',
    },
  },
  'saas-b2b': {
    name: '',
    tagline: 'Software that scales with your business',
    targetAudiences: ['IT decision makers', 'Business owners', 'Department managers'],
    brandVoice: {
      tone: ['Professional', 'Confident', 'Solution-oriented'],
      keywords: ['efficiency', 'scalability', 'ROI', 'productivity', 'innovation'],
      avoid: ['buzzwords without substance', 'overpromising', 'competitor bashing'],
    },
    suggestedBudget: {
      monthly: 5000,
      adSpend: 3500,
    },
    recommendedPlan: {
      name: 'Professional',
      price: 399,
      features: ['Advanced analytics', 'Multi-channel campaigns', 'A/B testing', 'Priority support'],
      reason: 'Ideal for B2B SaaS looking to optimize conversion funnels and demonstrate ROI.',
    },
  },
  'saas-b2c': {
    name: '',
    tagline: 'Making life easier, one app at a time',
    targetAudiences: ['End consumers', 'Power users', 'Early adopters'],
    brandVoice: {
      tone: ['Friendly', 'Approachable', 'Enthusiastic'],
      keywords: ['easy', 'simple', 'fast', 'convenient', 'enjoy'],
      avoid: ['overly formal language', 'complex explanations', 'negative framing'],
    },
    suggestedBudget: {
      monthly: 3000,
      adSpend: 2500,
    },
    recommendedPlan: {
      name: 'Growth',
      price: 199,
      features: ['Social media automation', 'Content calendar', 'Viral loop tracking', 'User engagement tools'],
      reason: 'Perfect for B2C apps focused on user acquisition and engagement through social channels.',
    },
  },
  'ecommerce': {
    name: '',
    tagline: 'Shop smarter, live better',
    targetAudiences: ['Online shoppers', 'Deal seekers', 'Brand loyalists'],
    brandVoice: {
      tone: ['Exciting', 'Trustworthy', 'Value-focused'],
      keywords: ['deals', 'quality', 'fast shipping', 'satisfaction', 'exclusive'],
      avoid: ['pushy sales tactics', 'misleading claims', 'hidden fees mentions'],
    },
    suggestedBudget: {
      monthly: 4000,
      adSpend: 3000,
    },
    recommendedPlan: {
      name: 'Professional',
      price: 399,
      features: ['Product feed optimization', 'Shopping ads management', 'Conversion tracking', 'Retargeting automation'],
      reason: 'Optimized for ecommerce brands with focus on ROAS and shopping campaign performance.',
    },
  },
  'healthcare': {
    name: '',
    tagline: 'Technology that cares',
    targetAudiences: ['Healthcare providers', 'Medical administrators', 'Patients'],
    brandVoice: {
      tone: ['Compassionate', 'Trustworthy', 'Clear'],
      keywords: ['care', 'health', 'wellbeing', 'secure', 'compliant'],
      avoid: ['medical claims without backing', 'fear-based marketing', 'HIPAA violations'],
    },
    suggestedBudget: {
      monthly: 3500,
      adSpend: 2000,
    },
    recommendedPlan: {
      name: 'Professional',
      price: 399,
      features: ['Compliance-focused content', 'Healthcare SEO', 'Reputation management', 'Patient journey tracking'],
      reason: 'Designed for healthcare tech with built-in compliance considerations and trust-building focus.',
    },
  },
  'fintech': {
    name: '',
    tagline: 'Finance made simple',
    targetAudiences: ['Finance professionals', 'Small business owners', 'Tech-savvy consumers'],
    brandVoice: {
      tone: ['Secure', 'Innovative', 'Transparent'],
      keywords: ['security', 'efficiency', 'savings', 'control', 'smart'],
      avoid: ['guaranteed returns promises', 'regulatory non-compliant claims', 'complex financial jargon'],
    },
    suggestedBudget: {
      monthly: 6000,
      adSpend: 4000,
    },
    recommendedPlan: {
      name: 'Enterprise',
      price: 799,
      features: ['Compliance review', 'Multi-region campaigns', 'Advanced attribution', 'White-glove support'],
      reason: 'Enterprise-grade for fintech requiring compliance oversight and sophisticated tracking.',
    },
  },
  'education': {
    name: '',
    tagline: 'Learning without limits',
    targetAudiences: ['Educators', 'Students', 'Institutions'],
    brandVoice: {
      tone: ['Inspiring', 'Supportive', 'Clear'],
      keywords: ['learn', 'grow', 'achieve', 'discover', 'succeed'],
      avoid: ['condescending tone', 'overly academic language', 'false success guarantees'],
    },
    suggestedBudget: {
      monthly: 2500,
      adSpend: 1500,
    },
    recommendedPlan: {
      name: 'Growth',
      price: 199,
      features: ['Content marketing tools', 'Student acquisition funnels', 'Engagement analytics', 'Seasonal campaign templates'],
      reason: 'Tailored for edtech with focus on enrollment cycles and student engagement.',
    },
  },
}

// Use Claude AI to parse product description and extract brand details
async function generateSuggestionsWithAI(description: string): Promise<{
  suggestedName: string
  suggestedSlug: string
  suggestedTagline: string
  suggestedIndustry: string
  suggestedDescription: string
  primaryDomain: string
  appDomain: string
  marketingSite: string
  targetAudiences: Array<{ name: string; role: string; painPoints: string; goals: string }>
  brandVoice: { tone: string[]; keywords: string[]; avoid: string[] }
  recommendedPlan: { name: string; price: number; features: string[]; reason: string }
  monthlyBudget: number
  contentThemes?: string[]
  hashtags?: { universal: string[]; vertical?: Record<string, string[]> }
  ctaPhrases?: string[]
  valuePropositions?: string[]
  elevatorPitch?: string
  competitorDifferentiators?: string[]
  visualStyle?: { colors: string; imageStyle: string; mood: string }
}> {
  const systemPrompt = `You are a marketing assistant helping to set up a brand in StewardGrowth, a social media marketing platform.

Your job is to parse comprehensive marketing breakdowns and extract ALL relevant information into a structured format.

The input may include:
- Product name, tagline, description
- Multiple target audiences/verticals with personas
- Brand voice guidelines (tone, keywords, avoid words)
- Content themes and post topics
- Hashtag strategies
- CTAs and value propositions
- Visual style guidance

You MUST return valid JSON with this structure (include all fields you can extract):
{
  "suggestedName": "Product Name",
  "suggestedSlug": "product-name-lowercase-with-dashes",
  "suggestedTagline": "The product tagline",
  "suggestedIndustry": "church-management|saas-b2b|saas-b2c|ecommerce|healthcare|fintech|education|nonprofit|sports|community|membership|other",
  "suggestedDescription": "A comprehensive 2-3 sentence description of the product",
  "primaryDomain": "domain.com",
  "appDomain": "app.domain.com",
  "marketingSite": "www.domain.com",
  "targetAudiences": [
    {
      "name": "Audience/Persona Name",
      "role": "Their Role/Title (e.g., Church Administrator, Executive Director)",
      "painPoints": "Their key pain points in 1-2 sentences",
      "goals": "What they want to achieve in 1-2 sentences"
    }
  ],
  "brandVoice": {
    "tone": ["Trait1", "Trait2", "Trait3"],
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "avoid": ["word1", "word2"]
  },
  "contentThemes": ["Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5", "Theme 6", "Theme 7"],
  "hashtags": {
    "universal": ["#hashtag1", "#hashtag2"],
    "vertical": {
      "churches": ["#ChurchTech", "#MinistryTools"],
      "nonprofits": ["#NonprofitTech"]
    }
  },
  "ctaPhrases": ["CTA 1", "CTA 2", "CTA 3"],
  "valuePropositions": ["Value prop 1", "Value prop 2"],
  "elevatorPitch": "The one-paragraph elevator pitch",
  "competitorDifferentiators": ["Differentiator 1", "Differentiator 2"],
  "visualStyle": {
    "colors": "Primary and accent colors",
    "imageStyle": "Authentic, professional, etc.",
    "mood": "Connected, empowered, etc."
  },
  "recommendedPlan": {
    "name": "Growth",
    "price": 199,
    "features": ["Feature 1", "Feature 2", "Feature 3"],
    "reason": "Why this plan fits"
  },
  "monthlyBudget": 3000
}

IMPORTANT RULES:
1. Extract EXACT VALUES from the input when provided (names, domains, personas, etc.)
2. For multi-vertical products, include ALL target audiences from ALL verticals
3. Combine hashtags from all verticals
4. Extract ALL content themes mentioned
5. Pull exact pain points and goals per persona when provided
6. If the input has vertical-specific taglines, use the universal one for suggestedTagline
7. For industry, pick the FIRST/PRIMARY vertical or use "other" for multi-vertical SaaS`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `Parse this comprehensive marketing breakdown and extract ALL brand/product details into the JSON structure:\n\n${description}`,
        },
      ],
      system: systemPrompt,
    })

    // Extract the text content
    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from AI')
    }

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = textContent.text
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())
    return parsed
  } catch (error) {
    console.error('AI parsing error:', error)
    // Fall back to simple extraction
    return generateSuggestionsFallback(description)
  }
}

// Fallback simple extraction (original logic)
function generateSuggestionsFallback(description: string): {
  suggestedName: string
  suggestedSlug: string
  suggestedTagline: string
  suggestedIndustry: string
  suggestedDescription: string
  primaryDomain: string
  appDomain: string
  marketingSite: string
  targetAudiences: Array<{ name: string; role: string; painPoints: string; goals: string }>
  brandVoice: { tone: string[]; keywords: string[]; avoid: string[] }
  recommendedPlan: { name: string; price: number; features: string[]; reason: string }
  monthlyBudget: number
} {
  const lowerDesc = description.toLowerCase()

  // Detect industry from description
  let industry = 'saas-b2b'
  if (lowerDesc.includes('church') || lowerDesc.includes('ministry') || lowerDesc.includes('congregation')) {
    industry = 'church-management'
  } else if (lowerDesc.includes('shop') || lowerDesc.includes('store') || lowerDesc.includes('ecommerce') || lowerDesc.includes('product')) {
    industry = 'ecommerce'
  } else if (lowerDesc.includes('health') || lowerDesc.includes('medical') || lowerDesc.includes('patient')) {
    industry = 'healthcare'
  } else if (lowerDesc.includes('finance') || lowerDesc.includes('payment') || lowerDesc.includes('bank') || lowerDesc.includes('money')) {
    industry = 'fintech'
  } else if (lowerDesc.includes('learn') || lowerDesc.includes('education') || lowerDesc.includes('course') || lowerDesc.includes('student')) {
    industry = 'education'
  } else if (lowerDesc.includes('consumer') || lowerDesc.includes('app') || lowerDesc.includes('user')) {
    industry = 'saas-b2c'
  }

  const template = industryTemplates[industry]

  // Extract potential name from description
  const nameMatch = description.match(/Name:\s*(\w+)/i) || description.match(/"([^"]+)"/) || description.match(/called\s+(\w+)/i)
  const suggestedName = nameMatch ? nameMatch[1] : ''
  const suggestedSlug = suggestedName.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return {
    suggestedName,
    suggestedSlug,
    suggestedTagline: template.tagline,
    suggestedIndustry: industry,
    suggestedDescription: '',
    primaryDomain: '',
    appDomain: '',
    marketingSite: '',
    targetAudiences: template.targetAudiences.map(name => ({ name, role: '', painPoints: '', goals: '' })),
    brandVoice: template.brandVoice,
    recommendedPlan: template.recommendedPlan,
    monthlyBudget: template.suggestedBudget.monthly,
  }
}

export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()
    if (!userWithOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, data } = body

    switch (type) {
      case 'template':
        // Return industry template
        const templateId = data?.industry || 'saas-b2b'
        const template = industryTemplates[templateId]
        if (!template) {
          return NextResponse.json({ error: 'Template not found' }, { status: 404 })
        }
        return NextResponse.json({ template })

      case 'suggest':
        // Generate suggestions from product description using AI
        const description = data?.description || ''
        if (!description) {
          return NextResponse.json({ error: 'Description required' }, { status: 400 })
        }
        const suggestions = await generateSuggestionsWithAI(description)
        return NextResponse.json({ suggestions })

      case 'templates-list':
        // Return list of available templates
        return NextResponse.json({
          templates: Object.entries(industryTemplates).map(([id, template]) => ({
            id,
            name: id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            recommendedPlan: template.recommendedPlan,
          })),
        })

      default:
        return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI suggest error:', error)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
