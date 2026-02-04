export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// Create Supabase client with service role for storage operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const BUCKET_NAME = 'content-videos'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB for videos
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']

/**
 * POST /api/content/[id]/video
 *
 * Upload a video file for a content post (created in HeyGen)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get the content post
    const content = await db.contentPost.findUnique({
      where: { id: contentId },
      include: { brand: true },
    })

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Verify user has access to this brand
    if (content.brand.organizationId !== userOrg.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const platform = formData.get('platform') as string || 'tiktok'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No video file provided' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Video too large. Maximum size is 100MB.' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Allowed: MP4, MOV, WebM' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'mp4'
    const filename = `${userOrg.organizationId}/${content.brandId}/${platform}/${Date.now()}-${contentId}.${ext}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

    if (!bucketExists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: MAX_FILE_SIZE,
        allowedMimeTypes: ALLOWED_TYPES,
      })
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('[Video Upload] Storage error:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload video' },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filename)

    // Update content post with video URL
    const platformVersions = (content.platformVersions as Record<string, any>) || {}
    const platformData = platformVersions[platform] || {}

    await db.contentPost.update({
      where: { id: contentId },
      data: {
        platformVersions: {
          ...platformVersions,
          [platform]: {
            ...platformData,
            videoUrl: urlData.publicUrl,
            videoStatus: 'uploaded',
            videoUploadedAt: new Date().toISOString(),
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      videoUrl: urlData.publicUrl,
      message: 'Video uploaded successfully',
    })
  } catch (error) {
    console.error('[Video Upload] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/content/[id]/video
 *
 * Get video status for a content post
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contentId } = await params
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const content = await db.contentPost.findUnique({
      where: { id: contentId },
      include: { brand: true },
    })

    if (!content) {
      return NextResponse.json(
        { success: false, error: 'Content not found' },
        { status: 404 }
      )
    }

    // Check if this is a video content
    const videoplatforms = ['tiktok', 'youtube']
    const videoPlatform = content.platforms.find(p => videoplatforms.includes(p))

    if (!videoPlatform) {
      return NextResponse.json({
        success: true,
        isVideo: false,
      })
    }

    const platformVersions = (content.platformVersions as Record<string, any>) || {}
    const platformData = platformVersions[videoPlatform] || {}

    return NextResponse.json({
      success: true,
      isVideo: true,
      platform: videoPlatform,
      videoScript: platformData.videoScript,
      hook: platformData.hook,
      estimatedDuration: platformData.estimatedDuration,
      suggestedBackground: platformData.suggestedBackground,
      suggestedAvatar: platformData.suggestedAvatar,
      videoStatus: platformData.videoStatus || 'needs_creation',
      videoUrl: platformData.videoUrl,
    })
  } catch (error) {
    console.error('[Video] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get video status' },
      { status: 500 }
    )
  }
}
