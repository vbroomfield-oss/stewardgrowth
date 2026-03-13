export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// POST /api/books/[id]/generate-description - Generate an optimized Amazon book description
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
      book.description && `Current Description: ${book.description}`,
      book.category && `Category: ${book.category}`,
      book.isbn && `ISBN: ${book.isbn}`,
      book.asin && `ASIN: ${book.asin}`,
    ]
      .filter(Boolean)
      .join('\n')

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `Generate an optimized Amazon book description for the following book:\n\n${bookDetails}`,
        },
      ],
      system: `You are an expert Amazon book marketing copywriter. Your job is to create compelling, SEO-optimized book descriptions that maximize conversions on Amazon.

Generate a book description with the following structure:

1. **Attention-Grabbing Headline**: A bold, compelling headline that hooks readers immediately. Use HTML <b> tags for bold formatting.

2. **Opening Hook**: 2-3 sentences that create urgency or curiosity. Speak directly to the reader's pain points or desires.

3. **Key Features/Benefits**: 3-5 bullet points highlighting what the reader will gain. Use HTML formatting:
   - Use <b> for bold emphasis on key phrases
   - Use <br> for line breaks
   - Start each bullet with a compelling benefit

4. **Social Proof / Authority**: A brief section establishing the author's credibility or the book's unique value proposition.

5. **Call to Action**: A closing line that encourages the reader to buy now.

FORMAT RULES:
- Use HTML tags for formatting: <b>, <i>, <br>, <h2> (Amazon supports these)
- Include relevant SEO keywords naturally throughout the text for Amazon search discovery
- Keep the total description between 1500-2000 characters (Amazon's sweet spot)
- Write in second person ("you") to engage the reader directly
- Do NOT use markdown formatting - use only HTML tags
- Return ONLY the description text with HTML formatting, no additional commentary or wrapper`,
    })

    const textContent = message.content.find((block) => block.type === 'text')
    if (!textContent || textContent.type !== 'text') {
      return NextResponse.json(
        { success: false, error: 'Failed to generate description from AI' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      description: textContent.text,
    })
  } catch (error) {
    console.error('[API /api/books/[id]/generate-description] Error:', error)

    const message = error instanceof Error ? error.message : 'Unknown error'

    if (message.includes('API key') || message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { success: false, error: 'Anthropic API key not configured.' },
        { status: 503 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to generate book description' },
      { status: 500 }
    )
  }
}
