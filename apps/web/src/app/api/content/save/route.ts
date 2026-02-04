export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

/**
 * POST /api/content/save
 * Save generated content to database
 *
 * Body:
 * {
 *   "brandId": "brand-id",
 *   "title": "Post title",
 *   "content": "Main content",
 *   "platforms": ["twitter", "linkedin"],
 *   "scheduledFor"?: "2024-02-01T10:00:00Z",
 *   "status": "DRAFT" | "AWAITING_APPROVAL",
 *   "platformVersions"?: { twitter: {...}, linkedin: {...} },
 *   "aiGenerated"?: true,
 *   "aiPrompt"?: "original prompt",
 *   "aiModel"?: "gpt-4-turbo"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      brandId,
      title,
      content,
      platforms,
      scheduledFor,
      status = 'DRAFT',
      platformVersions,
      aiGenerated = false,
      aiPrompt,
      aiModel,
    } = body

    if (!brandId || !content) {
      return NextResponse.json(
        { success: false, error: 'brandId and content are required' },
        { status: 400 }
      )
    }

    // Verify user has access to this brand
    const brand = await db.saaSBrand.findFirst({
      where: {
        id: brandId,
        organizationId: userWithOrg.organizationId,
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found or access denied' },
        { status: 404 }
      )
    }

    // Create the content post
    const contentPost = await db.contentPost.create({
      data: {
        brandId,
        createdById: userWithOrg.id,
        title,
        content,
        platforms: platforms || [],
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        status: status as any,
        platformVersions: platformVersions || {},
        aiGenerated,
        aiPrompt,
        aiModel,
      },
    })

    // If status is AWAITING_APPROVAL, create an approval request
    if (status === 'AWAITING_APPROVAL') {
      await db.approvalRequest.create({
        data: {
          brandId,
          requesterId: userWithOrg.id,
          type: 'CONTENT_PUBLISH',
          status: 'PENDING',
          title: `Content: ${title || 'Untitled'}`,
          description: `AI-generated content for ${platforms?.join(', ') || 'publishing'}`,
          resourceType: 'ContentPost',
          resourceId: contentPost.id,
          proposedChanges: {
            content,
            platforms,
            scheduledFor,
            platformVersions,
          },
        },
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: contentPost.id,
        status: contentPost.status,
        createdAt: contentPost.createdAt,
      },
    })
  } catch (error) {
    console.error('Error saving content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save content' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/content/save
 * List saved content for the organization
 */
export async function GET(request: NextRequest) {
  try {
    const userWithOrg = await getUserWithOrganization()

    if (!userWithOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const brandId = searchParams.get('brandId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const content = await db.contentPost.findMany({
      where: {
        brand: { organizationId: userWithOrg.organizationId },
        ...(status && { status: status as any }),
        ...(brandId && { brandId }),
      },
      include: {
        brand: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({
      success: true,
      data: content,
    })
  } catch (error) {
    console.error('Error fetching content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    )
  }
}
