import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

// GET /api/ai/recommendations — Fetch existing recommendations
export async function GET(req: Request) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const brandId = searchParams.get('brandId')

    const where: Record<string, unknown> = {
      brand: { organizationId: user.organizationId },
    }
    if (brandId) where.brandId = brandId

    const recommendations = await db.aIRecommendation.findMany({
      where,
      include: { brand: { select: { name: true, slug: true } } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    return NextResponse.json({ success: true, recommendations })
  } catch (err) {
    console.error('Failed to fetch recommendations:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

// POST /api/ai/recommendations — Generate new AI recommendations for a brand
export async function POST(req: Request) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { brandId } = body as { brandId?: string }

    // Get brands
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        ...(brandId ? { id: brandId } : {}),
      },
      include: {
        _count: { select: { events: true, contentPosts: true } },
      },
    })

    if (brands.length === 0) {
      return NextResponse.json({ error: 'No brands found' }, { status: 404 })
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it in Settings > Integrations.' },
        { status: 503 }
      )
    }

    const anthropic = new Anthropic({ apiKey })
    const allRecommendations = []

    for (const brand of brands) {
      const brandVoice = brand.brandVoice as Record<string, unknown> | null
      const audiences = brand.targetAudiences as Array<Record<string, unknown>> | null
      const goals = brand.goals as Record<string, unknown> | null
      const budget = brand.budgetConstraints as Record<string, unknown> | null

      // Brand-specific marketing guidance
      let brandGuidance = ''
      const slug = brand.slug?.toLowerCase() || brand.name.toLowerCase()

      if (slug.includes('stewardpro') || slug.includes('steward-pro')) {
        brandGuidance = `
BRAND CONTEXT: StewardPro (stewardpro.app) is a ministry project management SaaS.
Target audience: churches, pastors, ministry administrators, nonprofit leaders.
Competes with Asana and Monday.com but built specifically for ministry organizations.
Focus recommendations on:
- Church/ministry community outreach
- LinkedIn and Facebook groups for pastors and church admins
- SEO content targeting ministry management keywords (e.g., "church project management", "ministry task management software")
- Partnership opportunities with church networks and denominations
- Email campaigns to ministry leaders
- Differentiating from generic tools like Asana/Monday`
      } else if (slug.includes('stewardring') || slug.includes('steward-ring')) {
        brandGuidance = `
BRAND CONTEXT: StewardRing (stewardring.com) is an AI-powered business phone system with VoIP, SMS/MMS, and 24/7 AI Receptionist.
Target audience: small businesses across 13+ verticals — churches, real estate agents, property managers, medical/dental offices, legal firms, automotive dealers, home service contractors, restaurants, salons.
Competes with RingCentral, Grasshopper, Google Voice.
Focus recommendations on:
- Multi-vertical outreach (not just churches)
- Local business communities and chambers of commerce
- LinkedIn outreach to small business owners
- Industry-specific content for each vertical
- Highlighting the AI Receptionist as the KEY differentiator
- Promo code PARTNER26 for 20% off forever
- SEO keywords: "AI receptionist for small business", "business phone system", "AI answering service"`
      } else if (slug.includes('bfield') || slug.includes('ministry') || slug.includes('broomfield')) {
        brandGuidance = `
BRAND CONTEXT: Bfield Ministry (vincentbroomfield.co) is Vincent Broomfield's ministry brand and author platform.
Covers: (a) Amazon-published books — faith-based, ministry, and leadership titles — and (b) ministry/speaking/brand awareness content.
Target audience: faith-based readers, church leaders, pastors, ministry community, Christian living readers.
Focus recommendations on:
- Amazon book promotion strategies (reviews, rank optimization, A+ content)
- Book reviews and reader outreach campaigns
- Ministry speaking and guest appearance opportunities
- Social media content for faith-based audience
- Email list building for ministry community
- Cross-promotion between books and ministry platform`
      }

      const prompt = `You are a senior marketing strategist. Generate specific, actionable marketing recommendations for "${brand.name}" (${brand.domain || 'no website yet'}).

${brandGuidance}

Additional Brand Details:
- Brand Voice: ${brandVoice ? JSON.stringify(brandVoice) : 'Not configured'}
- Target Audiences: ${audiences ? JSON.stringify(audiences) : 'Not configured'}
- Goals: ${goals ? JSON.stringify(goals) : 'Not configured'}
- Budget: ${budget ? JSON.stringify(budget) : 'Not configured'}
- Events tracked: ${brand._count.events}
- Content posts created: ${brand._count.contentPosts}

Generate exactly 7 specific, actionable marketing recommendations. For each, provide:
1. A clear title (under 60 chars)
2. A detailed description (2-3 sentences) explaining EXACTLY what to do, why it matters, and expected impact
3. Estimated time to complete (e.g., "30 minutes", "2 hours", "1 day")
4. A category: one of SEO_OPPORTUNITY, CONTENT_IDEA, TRENDING_TOPIC, BUDGET_REALLOCATION, MARKET_INSIGHT, CREATIVE_REFRESH
5. Priority: LOW, MEDIUM, or HIGH
6. Estimated impact: brief phrase like "Could increase leads 20%"

Be SPECIFIC — no generic advice. Reference the exact brand, product, and audience.

Respond in JSON format:
[
  {
    "title": "...",
    "description": "...",
    "timeEstimate": "...",
    "category": "...",
    "priority": "...",
    "estimatedImpact": "..."
  }
]`

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      let parsed: Array<{
        title: string
        description: string
        category: string
        priority: string
        estimatedImpact: string
      }> = []

      try {
        const jsonMatch = text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0])
        }
      } catch {
        console.error('Failed to parse AI response for brand', brand.name)
        continue
      }

      // Map category strings to enum values
      const categoryMap: Record<string, string> = {
        SEO_OPPORTUNITY: 'SEO_OPPORTUNITY',
        CONTENT_IDEA: 'CONTENT_IDEA',
        TRENDING_TOPIC: 'TRENDING_TOPIC',
        BUDGET_REALLOCATION: 'BUDGET_REALLOCATION',
        MARKET_INSIGHT: 'MARKET_INSIGHT',
        CREATIVE_REFRESH: 'CREATIVE_REFRESH',
        KEYWORD_TARGET: 'KEYWORD_TARGET',
        REPURPOSE_CONTENT: 'REPURPOSE_CONTENT',
      }

      const priorityMap: Record<string, string> = {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
        URGENT: 'URGENT',
      }

      for (const rec of parsed) {
        try {
          const recType = categoryMap[rec.category] || 'MARKET_INSIGHT'
          const recPriority = priorityMap[rec.priority] || 'MEDIUM'
          const created = await db.aIRecommendation.create({
            data: {
              brandId: brand.id,
              type: recType as any,
              title: rec.title || 'Untitled Recommendation',
              description: rec.description || '',
              priority: recPriority as any,
              estimatedImpact: rec.estimatedImpact || null,
              status: 'PENDING',
            },
          })
          allRecommendations.push(created)
        } catch (e) {
          console.error('Failed to save recommendation:', e)
        }
      }
    }

    return NextResponse.json({
      success: true,
      count: allRecommendations.length,
      recommendations: allRecommendations,
    })
  } catch (err) {
    console.error('Failed to generate recommendations:', err)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }
}
