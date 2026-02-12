export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'
import { generateImage } from '@/lib/ai/openai'

interface BrandSettings {
  color?: string
  visualStyle?: {
    colors?: string
    imageStyle?: string
    mood?: string
  }
}

interface ProposedChanges {
  content?: string
  imageUrl?: string
  platforms?: string[]
  platformVersions?: Record<string, any>
  bookId?: string
}

// POST /api/approvals/[id]/regenerate-image - Regenerate AI image with brand focus
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: approvalId } = await params
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find the approval with brand info
    const approval = await db.approvalRequest.findFirst({
      where: {
        id: approvalId,
        brand: { organizationId: userWithOrg.organizationId },
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            settings: true,
            brandVoice: true,
            books: {
              select: {
                id: true,
                title: true,
                coverImage: true,
                author: true,
              },
              where: { deletedAt: null },
            },
          },
        },
      },
    })

    if (!approval) {
      return NextResponse.json(
        { success: false, error: 'Approval not found' },
        { status: 404 }
      )
    }

    // Get the content post if this is a content approval
    let contentPost = null
    if (approval.resourceType === 'ContentPost' && approval.resourceId) {
      contentPost = await db.contentPost.findUnique({
        where: { id: approval.resourceId },
      })
    }

    const proposedChanges = (approval.proposedChanges || {}) as ProposedChanges
    const brandSettings = (approval.brand?.settings || {}) as BrandSettings
    const brandVoice = approval.brand?.brandVoice as { tone?: string; personality?: string } | null

    // Determine content and platform for image generation
    const content = proposedChanges.content || contentPost?.content || ''
    const platforms = proposedChanges.platforms || contentPost?.platforms || []
    const platform = platforms[0] || 'instagram'

    // Check if there's an associated book (for book cover context)
    let bookContext = ''
    let bookCoverStyle = ''

    // Check if the content is for a specific book
    const bookId = proposedChanges.bookId
    if (bookId) {
      const book = approval.brand?.books?.find(b => b.id === bookId)
      if (book) {
        bookContext = `This content is promoting the book "${book.title}" by ${book.author}.`
        if (book.coverImage) {
          bookCoverStyle = `The image style should complement and reference the book cover design.`
        }
      }
    } else if (approval.brand?.books && approval.brand.books.length > 0) {
      // Use the first book's context if available
      const book = approval.brand.books[0]
      bookContext = `This content is for a brand that publishes books like "${book.title}".`
      if (book.coverImage) {
        bookCoverStyle = `Consider the brand's book cover aesthetic when generating the image.`
      }
    }

    // Build brand-focused image prompt
    const brandName = approval.brand?.name || 'Brand'
    const brandColor = brandSettings.color || '#6366f1'
    const visualStyle = brandSettings.visualStyle
    const colorPalette = visualStyle?.colors || brandColor
    const imageStyle = visualStyle?.imageStyle || 'professional and modern'
    const mood = visualStyle?.mood || 'inspiring and engaging'
    const brandTone = brandVoice?.tone || 'professional'

    // Platform-specific sizing
    const platformSizes: Record<string, '1024x1024' | '1792x1024' | '1024x1792'> = {
      instagram: '1024x1024',
      facebook: '1792x1024',
      twitter: '1792x1024',
      linkedin: '1792x1024',
      pinterest: '1024x1792',
      tiktok: '1024x1792',
      youtube: '1792x1024',
      threads: '1024x1024',
    }

    // Build comprehensive prompt with brand context
    const imagePrompt = `Create a ${imageStyle} social media graphic for ${platform}.

BRAND CONTEXT:
- Brand: ${brandName}
- Brand Color Palette: ${colorPalette}
- Brand Mood: ${mood}
- Brand Tone: ${brandTone}
${bookContext}
${bookCoverStyle}

CONTENT THEME:
${content.substring(0, 300)}

VISUAL REQUIREMENTS:
- Use colors that complement ${brandColor} as the primary brand color
- Style: ${imageStyle}
- Mood: ${mood}
- Create a visually striking image that captures the essence of the content
- The image should feel cohesive with the brand identity

IMPORTANT: Do NOT include any text, words, letters, or typography in the image. Create a purely visual graphic that conveys the mood and theme. Use imagery, colors, and visual elements only.`

    console.log('[Regenerate Image] Generating with prompt:', imagePrompt.substring(0, 200) + '...')

    // Generate new image
    const imageResult = await generateImage(imagePrompt, {
      size: platformSizes[platform] || '1024x1024',
      quality: 'standard',
      style: 'natural',
    })

    if ('error' in imageResult) {
      console.error('[Regenerate Image] DALL-E error:', imageResult.error)
      return NextResponse.json(
        { success: false, error: `Failed to generate image: ${imageResult.error}` },
        { status: 500 }
      )
    }

    const newImageUrl = imageResult.url

    // Update the approval's proposedChanges with new image
    const updatedProposedChanges = {
      ...proposedChanges,
      imageUrl: newImageUrl,
      imageRegeneratedAt: new Date().toISOString(),
    }

    await db.approvalRequest.update({
      where: { id: approvalId },
      data: {
        proposedChanges: updatedProposedChanges,
      },
    })

    // Also update the content post if it exists
    if (contentPost) {
      const existingMedia = (contentPost.media || []) as Array<{ url: string; type: string }>
      const updatedMedia = existingMedia.length > 0
        ? existingMedia.map((m, i) => i === 0 ? { ...m, url: newImageUrl } : m)
        : [{ url: newImageUrl, type: 'image' }]

      const existingPlatformVersions = (contentPost.platformVersions || {}) as Record<string, any>
      const updatedPlatformVersions: Record<string, any> = {}

      // Update imageUrl in all platform versions
      for (const [p, version] of Object.entries(existingPlatformVersions)) {
        updatedPlatformVersions[p] = {
          ...version,
          imageUrl: newImageUrl,
        }
      }

      await db.contentPost.update({
        where: { id: contentPost.id },
        data: {
          media: updatedMedia,
          platformVersions: updatedPlatformVersions,
        },
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: userWithOrg.id,
        organizationId: userWithOrg.organizationId,
        action: 'approval.regenerate_image',
        resource: 'ApprovalRequest',
        resourceId: approvalId,
        changes: {
          before: { imageUrl: proposedChanges.imageUrl },
          after: { imageUrl: newImageUrl },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        imageUrl: newImageUrl,
        approvalId,
        regeneratedAt: new Date().toISOString(),
      },
      message: 'Image regenerated successfully with brand context',
    })
  } catch (error) {
    console.error('[Regenerate Image] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to regenerate image' },
      { status: 500 }
    )
  }
}
