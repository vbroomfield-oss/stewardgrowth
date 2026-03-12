export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { createSocialVideo } from '@/lib/video'

/**
 * POST /api/content/[id]/generate-video
 * Manually trigger video generation for a content post
 *
 * Body:
 * {
 *   "platform": "tiktok" | "youtube" | "instagram"
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
    const { platform = 'tiktok' } = body as { platform?: string }

    if (!['tiktok', 'youtube', 'instagram'].includes(platform)) {
      return NextResponse.json(
        { error: 'Platform must be tiktok, youtube, or instagram' },
        { status: 400 }
      )
    }

    // Get the content post
    const contentPost = await db.contentPost.findFirst({
      where: {
        id,
        brand: { organizationId: user.organizationId },
      },
      include: {
        brand: { select: { name: true, brandVoice: true } },
      },
    })

    if (!contentPost) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    // Check for video script in platformVersions
    const platformVersions = (contentPost.platformVersions as Record<string, Record<string, unknown>>) || {}
    const platformData = platformVersions[platform] || {}
    const videoScript = (platformData.videoScript as string) || contentPost.content

    if (!videoScript) {
      return NextResponse.json(
        { error: 'No video script found. Generate content with a video platform first.' },
        { status: 400 }
      )
    }

    // Determine brand voice style
    const brandVoice = contentPost.brand.brandVoice as Record<string, unknown> | null
    const voiceStyle = brandVoice?.personality
      ? (Array.isArray(brandVoice.personality) && brandVoice.personality.includes('friendly') ? 'friendly' : 'professional')
      : 'professional'

    // Generate video
    const result = await createSocialVideo({
      script: videoScript,
      platform: platform as 'tiktok' | 'youtube' | 'instagram',
      brandName: contentPost.brand.name,
      brandVoice: voiceStyle as 'professional' | 'friendly',
      musicStyle: 'inspirational',
    })

    // Update content post with render ID and status
    const updatedPlatformVersions = {
      ...platformVersions,
      [platform]: {
        ...platformData,
        renderId: result.renderId,
        videoStatus: result.status === 'queued' ? 'processing' : result.status,
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
    })
  } catch (error) {
    console.error('Video generation error:', error)
    return NextResponse.json(
      { error: 'Failed to start video generation' },
      { status: 500 }
    )
  }
}
