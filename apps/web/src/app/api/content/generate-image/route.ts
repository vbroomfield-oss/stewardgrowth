export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { generateSocialImage } from '@/lib/ai/openai'

/**
 * POST /api/content/generate-image
 * Generate or regenerate an image for content
 *
 * Body:
 * {
 *   "brandId": "brand-id",
 *   "content": "Content text to base image on",
 *   "platform": "instagram" | "twitter" | "linkedin" | etc.,
 *   "style": "professional" | "vibrant" | "minimalist"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { brandId, content, platform = 'instagram', style = 'professional' } = body

    if (!brandId || !content) {
      return NextResponse.json(
        { success: false, error: 'brandId and content are required' },
        { status: 400 }
      )
    }

    // Get brand name
    const brand = await db.saaSBrand.findFirst({
      where: { id: brandId, deletedAt: null },
      select: { name: true },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    const result = await generateSocialImage(content, {
      platform,
      brandName: brand.name,
      style: style as 'professional' | 'vibrant' | 'minimalist',
    })

    if ('error' in result) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.url,
    })
  } catch (error) {
    console.error('Image generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate image' },
      { status: 500 }
    )
  }
}
