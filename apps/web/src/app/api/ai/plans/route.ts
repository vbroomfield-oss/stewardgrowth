import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

// GET /api/ai/plans — Get existing weekly plans
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

    const plans = await db.marketingPlan.findMany({
      where,
      include: { brand: { select: { name: true, slug: true } } },
      orderBy: { weekStart: 'desc' },
      take: 10,
    })

    return NextResponse.json({ success: true, plans })
  } catch (err) {
    console.error('Failed to fetch plans:', err)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}

// POST /api/ai/plans — Generate a new weekly plan for a brand
export async function POST(req: Request) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { brandId } = body as { brandId: string }

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 })
    }

    const brand = await db.saaSBrand.findFirst({
      where: { id: brandId, organizationId: user.organizationId, deletedAt: null },
      include: {
        _count: { select: { events: true, contentPosts: true, adCampaigns: true } },
      },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY not configured. Add it in Settings > Integrations.' },
        { status: 503 }
      )
    }

    const brandVoice = brand.brandVoice as Record<string, unknown> | null
    const audiences = brand.targetAudiences as Array<Record<string, unknown>> | null
    const goals = brand.goals as Record<string, unknown> | null
    const budget = brand.budgetConstraints as Record<string, unknown> | null

    // Calculate week dates
    const now = new Date()
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek + 1) // Monday
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const prompt = `Create a 7-day marketing action plan for "${brand.name}" (${brand.domain || 'no website'}).

Brand Context:
- Brand Voice: ${brandVoice ? JSON.stringify(brandVoice) : 'Not defined'}
- Target Audiences: ${audiences ? JSON.stringify(audiences) : 'Not defined'}
- Goals: ${goals ? JSON.stringify(goals) : 'Not defined'}
- Budget: ${budget ? JSON.stringify(budget) : 'Not defined'}
- Current stats: ${brand._count.events} events tracked, ${brand._count.contentPosts} content posts, ${brand._count.adCampaigns} ad campaigns

Create a plan for the week of ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}.

For each day (Monday through Sunday), provide 2-3 specific tasks across categories:
- SEO (keyword targeting, content optimization)
- Content (blog posts, social media posts)
- Ads (campaign adjustments, new creatives)
- Outreach (partnerships, community engagement)

Respond in JSON format:
{
  "goals": ["Goal 1", "Goal 2", "Goal 3"],
  "focusAreas": ["SEO", "Content", "Social"],
  "actions": [
    {
      "day": "Monday",
      "tasks": [
        { "category": "Content", "task": "Specific task description", "priority": "HIGH" },
        { "category": "SEO", "task": "Specific task description", "priority": "MEDIUM" }
      ]
    }
  ],
  "budgetAllocation": {
    "content": 30,
    "ads": 50,
    "tools": 20
  },
  "analysis": "Brief 2-sentence analysis of the strategy for this week."
}`

    const anthropic = new Anthropic({ apiKey })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : ''

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let parsed: Record<string, any> = {}

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      }
    } catch {
      console.error('Failed to parse weekly plan response')
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Check if plan already exists for this week
    const existingPlan = await db.marketingPlan.findUnique({
      where: { brandId_weekStart: { brandId, weekStart } },
    })

    const planData = {
      goals: JSON.parse(JSON.stringify(parsed.goals || [])),
      actions: JSON.parse(JSON.stringify(parsed.actions || [])),
      budgetAllocation: JSON.parse(JSON.stringify(parsed.budgetAllocation || {})),
      focusAreas: (parsed.focusAreas || []) as string[],
      aiAnalysis: (parsed.analysis as string) || '',
      status: 'DRAFT' as const,
    }

    let plan
    if (existingPlan) {
      plan = await db.marketingPlan.update({
        where: { id: existingPlan.id },
        data: planData,
      })
    } else {
      plan = await db.marketingPlan.create({
        data: {
          brandId,
          weekStart,
          weekEnd,
          ...planData,
        },
      })
    }

    return NextResponse.json({ success: true, plan })
  } catch (err) {
    console.error('Failed to generate plan:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
