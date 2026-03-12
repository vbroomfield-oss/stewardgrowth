import { NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import Anthropic from '@anthropic-ai/sdk'

// POST /api/ai/chat — AI marketing assistant chat
export async function POST(req: Request) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { message, brandId } = body as { message: string; brandId?: string }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        response: 'The AI assistant needs an Anthropic API key to function. Please add your ANTHROPIC_API_KEY in Settings > Integrations to enable AI-powered responses.',
      })
    }

    // Get brand context
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        ...(brandId ? { id: brandId } : {}),
      },
      select: {
        name: true,
        slug: true,
        domain: true,
        brandVoice: true,
        targetAudiences: true,
        goals: true,
        budgetConstraints: true,
        _count: {
          select: { events: true, contentPosts: true, adCampaigns: true },
        },
      },
    })

    const brandContext = brands
      .map(
        (b) =>
          `- ${b.name} (${b.domain || 'no domain'}): ${b._count.events} events, ${b._count.contentPosts} content posts, ${b._count.adCampaigns} campaigns`
      )
      .join('\n')

    const systemPrompt = `You are an AI Marketing Strategist for StewardGrowth, a marketing automation platform. You help the user optimize their marketing across multiple brands.

Current brands:
${brandContext || 'No brands configured yet.'}

User: ${user.firstName} ${user.lastName}

Guidelines:
- Give specific, actionable marketing advice
- Reference the user's actual brands when possible
- Suggest concrete next steps
- Keep responses concise (2-4 paragraphs max)
- If asked about data you don't have, suggest they set up tracking or integrations
- Be encouraging and professional`

    const anthropic = new Anthropic({ apiKey })

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I could not generate a response.'

    return NextResponse.json({ success: true, response: text })
  } catch (err) {
    console.error('AI chat error:', err)
    return NextResponse.json(
      { error: 'Failed to get AI response' },
      { status: 500 }
    )
  }
}
