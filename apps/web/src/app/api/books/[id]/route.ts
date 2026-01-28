export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

// GET /api/books/[id] - Get a single book by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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
        id: params.id,
        brandId: { in: brandIds },
        deletedAt: null,
      },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        campaigns: {
          orderBy: { createdAt: 'desc' },
        },
        reviews: {
          orderBy: { reviewDate: 'desc' },
          take: 50,
        },
        salesData: {
          orderBy: { date: 'desc' },
          take: 90, // Last 90 days
        },
        launchPlans: {
          orderBy: { launchDate: 'desc' },
        },
      },
    })

    if (!book) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    // Calculate aggregated metrics
    const totalSales = book.salesData.reduce((sum, s) => sum + s.unitsSold, 0)
    const totalRevenue = book.salesData.reduce((sum, s) => sum + Number(s.revenue), 0)
    const totalRoyalties = book.salesData.reduce((sum, s) => sum + Number(s.royalties), 0)
    const totalPageReads = book.salesData.reduce((sum, s) => sum + s.pageReads, 0)
    const totalAdSpend = book.campaigns.reduce((sum, c) => sum + Number(c.spend), 0)
    const totalAdSales = book.campaigns.reduce((sum, c) => sum + Number(c.sales), 0)
    const avgRating = book.reviews.length > 0
      ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length
      : null

    // Calculate ACOS (Advertising Cost of Sales)
    const acos = totalAdSales > 0 ? (Number(totalAdSpend) / Number(totalAdSales)) * 100 : null

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        subtitle: book.subtitle,
        author: book.author,
        isbn: book.isbn,
        asin: book.asin,
        description: book.description,
        publishDate: book.publishDate?.toISOString(),
        category: book.category,
        price: book.price ? Number(book.price) : null,
        currency: book.currency,
        coverImage: book.coverImage,
        amazonUrl: book.amazonUrl,
        kindleUrl: book.kindleUrl,
        audibleUrl: book.audibleUrl,
        barnesNobleUrl: book.barnesNobleUrl,
        brand: book.brand,
        isActive: book.isActive,
        createdAt: book.createdAt.toISOString(),
        updatedAt: book.updatedAt.toISOString(),
        // Related data
        campaigns: book.campaigns.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          dailyBudget: c.dailyBudget ? Number(c.dailyBudget) : null,
          spend: Number(c.spend),
          sales: Number(c.sales),
          impressions: c.impressions,
          clicks: c.clicks,
          orders: c.orders,
          acos: c.acos ? Number(c.acos) : null,
          lastSyncAt: c.lastSyncAt?.toISOString(),
        })),
        reviews: book.reviews.map((r) => ({
          id: r.id,
          platform: r.platform,
          rating: r.rating,
          title: r.title,
          content: r.content,
          reviewerName: r.reviewerName,
          reviewDate: r.reviewDate.toISOString(),
          verified: r.verified,
          helpful: r.helpful,
          sentiment: r.sentiment,
        })),
        launchPlans: book.launchPlans.map((lp) => ({
          id: lp.id,
          name: lp.name,
          description: lp.description,
          launchDate: lp.launchDate.toISOString(),
          status: lp.status,
          totalBudget: lp.totalBudget ? Number(lp.totalBudget) : null,
          adBudget: lp.adBudget ? Number(lp.adBudget) : null,
          promoBudget: lp.promoBudget ? Number(lp.promoBudget) : null,
          tasks: lp.tasks,
        })),
        // Aggregated metrics
        metrics: {
          totalSales,
          totalRevenue,
          totalRoyalties,
          totalPageReads,
          totalAdSpend,
          totalAdSales,
          acos,
          avgRating,
          reviewCount: book.reviews.length,
          campaignCount: book.campaigns.length,
        },
      },
    })
  } catch (error) {
    console.error('[API /api/books/[id]] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch book' },
      { status: 500 }
    )
  }
}

// PATCH /api/books/[id] - Update a book
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Get all brands for this organization
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    const brandIds = brands.map((b) => b.id)

    const existingBook = await db.book.findFirst({
      where: {
        id: params.id,
        brandId: { in: brandIds },
        deletedAt: null,
      },
    })

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    const updatedBook = await db.book.update({
      where: { id: existingBook.id },
      data: {
        title: body.title ?? existingBook.title,
        subtitle: body.subtitle ?? existingBook.subtitle,
        author: body.author ?? existingBook.author,
        isbn: body.isbn ?? existingBook.isbn,
        asin: body.asin ?? existingBook.asin,
        description: body.description ?? existingBook.description,
        publishDate: body.publishDate ? new Date(body.publishDate) : existingBook.publishDate,
        category: body.category ?? existingBook.category,
        price: body.price !== undefined ? parseFloat(body.price) : existingBook.price,
        currency: body.currency ?? existingBook.currency,
        amazonUrl: body.amazonUrl ?? existingBook.amazonUrl,
        kindleUrl: body.kindleUrl ?? existingBook.kindleUrl,
        audibleUrl: body.audibleUrl ?? existingBook.audibleUrl,
        barnesNobleUrl: body.barnesNobleUrl ?? existingBook.barnesNobleUrl,
        coverImage: body.coverImage ?? existingBook.coverImage,
        isActive: body.isActive ?? existingBook.isActive,
        settings: body.settings ?? existingBook.settings,
      },
    })

    return NextResponse.json({
      success: true,
      book: updatedBook,
    })
  } catch (error) {
    console.error('[API /api/books/[id]] Update error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update book' },
      { status: 500 }
    )
  }
}

// DELETE /api/books/[id] - Soft delete a book
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all brands for this organization
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    const brandIds = brands.map((b) => b.id)

    const existingBook = await db.book.findFirst({
      where: {
        id: params.id,
        brandId: { in: brandIds },
        deletedAt: null,
      },
    })

    if (!existingBook) {
      return NextResponse.json(
        { success: false, error: 'Book not found' },
        { status: 404 }
      )
    }

    await db.book.update({
      where: { id: existingBook.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      message: 'Book deleted successfully',
    })
  } catch (error) {
    console.error('[API /api/books/[id]] Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete book' },
      { status: 500 }
    )
  }
}
