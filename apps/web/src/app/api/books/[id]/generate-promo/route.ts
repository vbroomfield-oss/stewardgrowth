export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const ALL_PLATFORMS = ['twitter', 'linkedin', 'facebook', 'instagram'] as const
type Platform = (typeof ALL_PLATFORMS)[number]

// POST /api/books/[id]/generate-promo - Generate platform-specific promotional posts
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

    let body: { platforms?: string[] } = {}
    try {
      body = await request.json()
    } catch {
      // No body provided, use defaults
    }

    const requestedPlatforms = (body.platforms ?? [...ALL_PLATFORMS]).filter(
      (p): p is Platform => ALL_PLATFORMS.includes(p as Platform)
    )

    if (requestedPlatforms.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid platforms specified. Valid options: twitter, linkedin, facebook, instagram' },
        { status: 400 }
      )
    }

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
    ]
      .filter(Boolean)
      .join('\n')

    const platformInstructions = requestedPlatforms
      .map((platform) => {
        switch (platform) {
          case 'twitter':
            return `**twitter**: A compelling tweet promoting the book. MUST be 280 characters or fewer. Include 2-3 relevant hashtags. Use a hook, the book title, and a call to action. Make it shareable and engaging.`
          case 'linkedin':
            return `**linkedin**: A professional LinkedIn post (800-1200 characters). Lead with a thought-provoking question or insight related to the book's topic. Include the book title and author. Add a professional call to action. Use a storytelling approach that resonates with professionals. Include 3-5 relevant hashtags at the end.`
          case 'facebook':
            return `**facebook**: An engaging Facebook post (400-600 characters). Start with a relatable hook or question. Describe the book's value proposition in a conversational tone. Include a clear call to action (e.g., "Grab your copy today!" or "Link in comments"). Use 1-2 emojis sparingly for visual appeal.`
          case 'instagram':
            return `**instagram**: A visual-focused Instagram caption (800-1500 characters). Start with an attention-grabbing first line (this shows before "more"). Include the book's key themes and why readers will love it. Add a call to action. End with 15-20 relevant hashtags on a separate line including a mix of broad (#BookRecommendation, #MustRead) and niche hashtags related to the book's category.`
        }
      })
      .join('\n\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Generate promotional social media posts for the following book:\n\n${bookDetails}\n\nGenerate posts for these platforms:\n\n${platformInstructions}`,
        },
      ],
      system: `You are an expert social media marketer specializing in book promotion. Generate platform-specific promotional posts that are optimized for each platform's algorithm and audience.

You MUST return valid JSON with a key for each requested platform. Each value should be the post text as a string.

Example format:
{
  "twitter": "post text here",
  "linkedin": "post text here"
}

RULES:
- Return ONLY the JSON object, no markdown code blocks, no additional text
- Each post must be tailored to its platform's unique style, audience, and character constraints
- Twitter posts MUST be 280 characters or fewer (this is a hard limit)
- Make each post feel native to its platform, not like a copy-paste across platforms
- Include relevant hashtags appropriate to each platform's culture`,
    })

    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Failed to generate promo posts from AI' },
        { status: 500 }
      )
    }

    // Parse the JSON response, handling potential markdown code blocks
    let jsonStr = textContent.text
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    let posts: Record<string, string>
    try {
      posts = JSON.parse(jsonStr.trim())
    } catch {
      console.error('[API /api/books/[id]/generate-promo] Failed to parse AI response:', jsonStr)
      return NextResponse.json(
        { success: false, error: 'Failed to parse AI-generated posts' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      posts,
    })
  } catch (error) {
    console.error('[API /api/books/[id]/generate-promo] Error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('API key') || message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'Anthropic API key not configured.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate promotional posts' },
      { status: 500 }
    )
  }
}
