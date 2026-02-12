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

    // Check if there's an associated book with a cover image
    let bookContext = ''
    let bookCoverUrl: string | null = null

    // Check if the content is for a specific book
    const bookId = proposedChanges.bookId
    if (bookId) {
      const book = approval.brand?.books?.find(b => b.id === bookId)
      if (book) {
        bookContext = `This content is promoting the book "${book.title}" by ${book.author}.`
        if (book.coverImage) {
          bookCoverUrl = book.coverImage
        }
      }
    } else if (approval.brand?.books && approval.brand.books.length > 0) {
      // Use the first book's context if available
      const book = approval.brand.books[0]
      bookContext = `This content is for a brand that publishes books like "${book.title}".`
      if (book.coverImage) {
        bookCoverUrl = book.coverImage
      }
    }

    // If we have a book cover, just use it directly - that's the best image for book marketing!
    if (bookCoverUrl) {
      console.log('[Regenerate Image] Using book cover image directly:', bookCoverUrl)

      // Update the approval's proposedChanges with book cover
      const updatedProposedChanges = {
        ...proposedChanges,
        imageUrl: bookCoverUrl,
        imageRegeneratedAt: new Date().toISOString(),
        imageSource: 'book_cover',
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
          ? existingMedia.map((m, i) => i === 0 ? { ...m, url: bookCoverUrl } : m)
          : [{ url: bookCoverUrl, type: 'image' }]

        const existingPlatformVersions = (contentPost.platformVersions || {}) as Record<string, any>
        const updatedPlatformVersions: Record<string, any> = {}

        for (const [p, version] of Object.entries(existingPlatformVersions)) {
          updatedPlatformVersions[p] = {
            ...version,
            imageUrl: bookCoverUrl,
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
          action: 'approval.use_book_cover',
          resource: 'ApprovalRequest',
          resourceId: approvalId,
          changes: {
            before: { imageUrl: proposedChanges.imageUrl },
            after: { imageUrl: bookCoverUrl, source: 'book_cover' },
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          imageUrl: bookCoverUrl,
          approvalId,
          regeneratedAt: new Date().toISOString(),
          source: 'book_cover',
        },
        message: 'Using book cover image - the best choice for book marketing!',
      })
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

    // Build comprehensive prompt with brand context - NO TEXT, just scenic/mood imagery
    const imagePrompt = `Create a ${imageStyle} social media graphic for ${platform}.

BRAND CONTEXT:
- Brand: ${brandName}
- Brand Color Palette: ${colorPalette}
- Brand Mood: ${mood}
- Brand Tone: ${brandTone}
${bookContext}

CONTENT THEME:
${content.substring(0, 300)}

VISUAL REQUIREMENTS:
- Create a beautiful scenic or abstract image that captures the mood and theme
- Use colors that complement ${brandColor} as the primary brand color
- Style: ${imageStyle}
- Mood: ${mood}
- Focus on landscapes, nature, abstract patterns, or lifestyle imagery
- The image should evoke emotion and connect with the content theme

CRITICAL RULES - MUST FOLLOW:
1. ABSOLUTELY NO TEXT, WORDS, LETTERS, NUMBERS, LOGOS, OR TYPOGRAPHY
2. NO book covers, NO product mockups, NO design elements that look like printed materials
3. Create a PURELY VISUAL, photographic or artistic image
4. Think: beautiful background, nature scene, abstract art, or lifestyle moment
5. The image will be used BEHIND text, so keep it clean and uncluttered`

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
