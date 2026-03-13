export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { createSocialVideo, type VideoTemplate } from '@/lib/video'

/**
 * POST /api/content/[id]/generate-video
 * Generate a professional ecommerce-style ad video for a content post
 *
 * Body:
 * {
 *   "platform": "tiktok" | "youtube" | "instagram" | "facebook",
 *   "template": "product-showcase" | "promo-ad" | "testimonial" | "brand-story" | "before-after",
 *   "ctaText": "Shop Now",
 *   "ctaSubtext": "Use code SAVE20",
 *   "musicStyle": "energetic" | "modern" | "luxury" | "hype" | "minimal"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserWithOrganization()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (!process.env.SHOTSTACK_API_KEY) {
      return NextResponse.json(
        { error: 'Video generation requires SHOTSTACK_API_KEY. Add it in Vercel environment variables.' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      platform = 'tiktok',
      template = 'product-showcase',
      ctaText = 'Shop Now',
      ctaSubtext,
      musicStyle = 'energetic',
    } = body as {
      platform?: string
      template?: VideoTemplate
      ctaText?: string
      ctaSubtext?: string
      musicStyle?: string
    }

    if (!['tiktok', 'youtube', 'instagram', 'facebook'].includes(platform)) {
      return NextResponse.json(
        { error: 'Platform must be tiktok, youtube, instagram, or facebook' },
        { status: 400 }
      )
    }

    // Get the content post with brand details
    const contentPost = await db.contentPost.findFirst({
      where: {
        id,
        brand: { organizationId: user.organizationId },
      },
      include: {
        brand: true,
      },
    })

    if (!contentPost) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Get video script from platform versions or fall back to content
    const platformVersions = (contentPost.platformVersions as Record<string, Record<string, unknown>>) || {}
    const platformData = platformVersions[platform] || {}
    const videoScript = (platformData.videoScript as string) || contentPost.content

    if (!videoScript) {
      return NextResponse.json(
        { error: 'No video script found. Generate content with a video platform first.' },
        { status: 400 }
      )
    }

    // Extract brand styling
    const brandSettings = (contentPost.brand.settings as Record<string, unknown>) || {}
    const brandVoice = contentPost.brand.brandVoice as Record<string, unknown> | null
    const voiceStyle = brandVoice?.personality
      ? (Array.isArray(brandVoice.personality) && brandVoice.personality.includes('friendly') ? 'friendly' : 'professional')
      : 'professional'
    const brandColor = (brandSettings.color as string) || '#1a1a2e'

    // Generate video with brand colors and ecommerce template
    const result = await createSocialVideo({
      script: videoScript,
      platform: platform as 'tiktok' | 'youtube' | 'instagram' | 'facebook',
      brandName: contentPost.brand.name,
      brandColor,
      brandLogoUrl: (brandSettings.logoUrl as string) || contentPost.brand.logo || undefined,
      brandVoice: voiceStyle as 'professional' | 'friendly',
      musicStyle: musicStyle as 'energetic' | 'modern' | 'luxury' | 'hype' | 'minimal',
      template,
      ctaText,
      ctaSubtext,
    })

    // Update content post with render ID and status
    const updatedPlatformVersions = {
      ...platformVersions,
      [platform]: {
        ...platformData,
        renderId: result.renderId,
        videoStatus: 'processing',
        videoTemplate: template,
      },
    }

    await db.contentPost.update({
      where: { id },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { platformVersions: updatedPlatformVersions as any },
    })

    return NextResponse.json({
      success: true,
      renderId: result.renderId,
      status: result.status,
      template,
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    )
  }
}
