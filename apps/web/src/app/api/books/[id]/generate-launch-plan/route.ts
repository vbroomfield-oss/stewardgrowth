export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// POST /api/books/[id]/generate-launch-plan - Generate a comprehensive book launch plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    let body: { launchDate?: string; budget?: number } = {}
    try {
      body = await request.json()
    } catch {
      // No body provided, use defaults
    }

    const { launchDate, budget } = body

    // Get all brands for this organization to verify access
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    const brandIds = brands.map((b) => b.id)

    const book = await db.book.findFirst({
      where: {
        id: bookId,
        brandId: { in: brandIds },
        deletedAt: null,
      },
    })

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    const bookDetails = [
      book.title && `Title: ${book.title}`,
      book.subtitle && `Subtitle: ${book.subtitle}`,
      book.author && `Author: ${book.author}`,
      book.description && `Description: ${book.description}`,
      book.category && `Category: ${book.category}`,
      book.isbn && `ISBN: ${book.isbn}`,
      book.asin && `ASIN: ${book.asin}`,
    ]
      .filter(Boolean)
      .join('\n')

    const launchContext = [
      launchDate && `Launch Date: ${launchDate}`,
      budget !== undefined && `Total Budget: $${budget}`,
    ]
      .filter(Boolean)
      .join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `Generate a comprehensive book launch plan for:\n\n${bookDetails}${launchContext ? `\n\nLaunch Context:\n${launchContext}` : ''}`,
        },
      ],
      system: `You are an expert book launch strategist with deep experience in Amazon publishing, social media marketing, and author platform building. Generate a detailed, actionable book launch plan.

You MUST return valid JSON with this exact structure:

{
  "phases": [
    {
      "name": "Pre-Launch",
      "timeframe": "4 Weeks Before Launch",
      "description": "Build anticipation and prepare your audience",
      "tasks": [
        {
          "title": "Task name",
          "description": "Detailed description of what to do",
          "dueOffset": -28,
          "category": "social_media|email|advertising|content|outreach|admin",
          "priority": "high|medium|low"
        }
      ],
      "socialMediaTeasers": [
        {
          "platform": "twitter|linkedin|facebook|instagram",
          "content": "Example teaser post text",
          "timing": "When to post this (e.g., '3 weeks before launch')"
        }
      ],
      "emailSequence": [
        {
          "subject": "Email subject line",
          "description": "What this email covers",
          "timing": "When to send"
        }
      ]
    },
    {
      "name": "Launch Week",
      "timeframe": "Launch Week (Day -1 to Day 7)",
      "description": "Maximum visibility and sales push",
      "dailyActivities": [
        {
          "day": "Day 1 (Launch Day)",
          "tasks": ["Task 1", "Task 2"],
          "platformStrategy": {
            "amazon": "What to do on Amazon",
            "social": "Social media activities",
            "email": "Email to send"
          }
        }
      ],
      "promotionSchedule": [
        {
          "activity": "Promotion name",
          "platform": "Where to run it",
          "description": "Details",
          "timing": "When"
        }
      ]
    },
    {
      "name": "Post-Launch",
      "timeframe": "2 Weeks After Launch",
      "description": "Sustain momentum and gather reviews",
      "tasks": [
        {
          "title": "Task name",
          "description": "Detailed description",
          "dueOffset": 7,
          "category": "reviews|marketing|advertising|analytics",
          "priority": "high|medium|low"
        }
      ],
      "reviewStrategy": {
        "approach": "How to solicit reviews ethically",
        "targets": ["Where to seek reviews"],
        "templates": ["Example outreach message"]
      },
      "sustainedMarketing": [
        {
          "channel": "Channel name",
          "frequency": "How often",
          "contentIdeas": ["Idea 1", "Idea 2"]
        }
      ]
    }
  ],${budget !== undefined ? `
  "budgetAllocation": {
    "totalBudget": ${budget},
    "advertising": { "amount": 0, "percentage": 0, "breakdown": { "amazonAds": 0, "socialAds": 0, "bookPromo": 0 } },
    "content": { "amount": 0, "percentage": 0, "breakdown": { "graphics": 0, "video": 0, "copywriting": 0 } },
    "outreach": { "amount": 0, "percentage": 0, "breakdown": { "reviewCopies": 0, "influencers": 0, "prServices": 0 } },
    "tools": { "amount": 0, "percentage": 0, "breakdown": { "emailPlatform": 0, "schedulingTools": 0, "analytics": 0 } },
    "reserve": { "amount": 0, "percentage": 0, "purpose": "Contingency for opportunities" }
  },` : ''}
  "estimatedBudget": {
    "minimum": 0,
    "recommended": 0,
    "premium": 0,
    "currency": "USD"
  },
  "timeline": {
    "startDate": "${launchDate ? new Date(new Date(launchDate).getTime() - 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 'TBD (4 weeks before launch)'}",
    "launchDate": "${launchDate || 'TBD'}",
    "endDate": "${launchDate ? new Date(new Date(launchDate).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 'TBD (2 weeks after launch)'}",
    "totalWeeks": 6,
    "keyMilestones": [
      { "date": "date or offset", "milestone": "What happens" }
    ]
  },
  "kpis": [
    { "metric": "KPI name", "target": "Target value", "measurementMethod": "How to track" }
  ]
}

RULES:
- Return ONLY the JSON object, no markdown code blocks, no additional text
- Generate realistic, actionable tasks specific to the book's genre/category
- Include platform-specific strategies for Amazon, social media, and email
- Pre-launch phase should cover 4 weeks of preparation
- Launch week should have day-by-day activities for at least 5 days
- Post-launch should cover 2 weeks of sustained marketing and review gathering
${budget !== undefined ? `- Allocate the $${budget} budget realistically across all categories` : '- Provide estimated budget ranges (minimum, recommended, premium) for the launch'}
- All dueOffset values are relative to launch date (negative = before, positive = after)
- Make tasks specific to the book's category and audience`,
    })

    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Failed to generate launch plan from AI' },
        { status: 500 }
      )
    }

    // Parse the JSON response, handling potential markdown code blocks
    let jsonStr = textContent.text
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    let plan: Record<string, unknown>
    try {
      plan = JSON.parse(jsonStr.trim())
    } catch {
      console.error('[API /api/books/[id]/generate-launch-plan] Failed to parse AI response:', jsonStr)
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI-generated launch plan' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      plan,
    })
  } catch (error) {
    console.error('[API /api/books/[id]/generate-launch-plan] Error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('API key') || message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'Anthropic API key not configured.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate launch plan' },
      { status: 500 }
    )
  }
}
