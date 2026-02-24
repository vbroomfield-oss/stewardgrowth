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

      const prompt = `You are a marketing strategist for "${brand.name}" (${brand.domain || 'no website yet'}).

Brand Details:
- Name: ${brand.name}
- Domain: ${brand.domain || 'Not set'}
- Brand Voice: ${brandVoice ? JSON.stringify(brandVoice) : 'Not configured'}
- Target Audiences: ${audiences ? JSON.stringify(audiences) : 'Not configured'}
- Goals: ${goals ? JSON.stringify(goals) : 'Not configured'}
- Budget: ${budget ? JSON.stringify(budget) : 'Not configured'}
- Events tracked: ${brand._count.events}
- Content posts: ${brand._count.contentPosts}

Generate exactly 3 actionable marketing recommendations. For each, provide:
1. A clear title (under 60 chars)
2. A detailed description (2-3 sentences) explaining WHY and HOW
3. A category: one of SEO_OPPORTUNITY, CONTENT_IDEA, TRENDING_TOPIC, BUDGET_REALLOCATION, MARKET_INSIGHT, CREATIVE_REFRESH
4. Priority: LOW, MEDIUM, or HIGH
5. Estimated impact: brief phrase like "Could increase leads 20%"

Respond in JSON format:
[
  {
    "title": "...",
    "description": "...",
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
