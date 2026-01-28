export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'

// GET /api/books - List all books for the user's organization
export async function GET(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get brandId from query params (optional filter)
    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    // Get all brands for this organization
    const brands = await db.saaSBrand.findMany({
      where: {
        organizationId: userOrg.organizationId,
        deletedAt: null,
      },
      select: { id: true },
    })

    const brandIds = brands.map((b) => b.id)

    // Fetch books from database
    const books = await db.book.findMany({
      where: {
        brandId: brandId ? brandId : { in: brandIds },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        campaigns: {
          select: {
            id: true,
            spend: true,
            sales: true,
            impressions: true,
            clicks: true,
            orders: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        salesData: {
          select: {
            unitsSold: true,
            revenue: true,
            royalties: true,
          },
        },
        _count: {
          select: {
            campaigns: true,
            reviews: true,
            launchPlans: true,
          },
        },
      },
    })

    // Transform for API response with aggregated metrics
    const transformedBooks = books.map((book) => {
      const totalSales = book.salesData.reduce((sum, s) => sum + s.unitsSold, 0)
      const totalRevenue = book.salesData.reduce((sum, s) => sum + Number(s.revenue), 0)
      const totalRoyalties = book.salesData.reduce((sum, s) => sum + Number(s.royalties), 0)
      const totalAdSpend = book.campaigns.reduce((sum, c) => sum + Number(c.spend), 0)
      const avgRating = book.reviews.length > 0
        ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length
        : null

      return {
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
        // Aggregated metrics
        metrics: {
          totalSales,
          totalRevenue,
          totalRoyalties,
          totalAdSpend,
          avgRating,
          reviewCount: book._count.reviews,
          campaignCount: book._count.campaigns,
          launchPlanCount: book._count.launchPlans,
        },
      }
    })

    return NextResponse.json({
      success: true,
      books: transformedBooks,
    })
  } catch (error) {
    console.error('[API /api/books] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch books' },
      { status: 500 }
    )
  }
}

// POST /api/books - Create a new book
export async function POST(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()

    if (!userOrg) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      brandId,
      title,
      subtitle,
      author,
      isbn,
      asin,
      description,
      publishDate,
      category,
      price,
      currency,
      amazonUrl,
      kindleUrl,
      audibleUrl,
      barnesNobleUrl,
      coverImage,
    } = body

    // Validate required fields
    if (!brandId || !title || !author) {
      return NextResponse.json(
        { success: false, error: 'Brand, title, and author are required' },
        { status: 400 }
      )
    }

    // Verify brand belongs to user's organization
    const brand = await db.saaSBrand.findFirst({
      where: {
        id: brandId,
        organizationId: userOrg.organizationId,
        deletedAt: null,
      },
    })

    if (!brand) {
      return NextResponse.json(
        { success: false, error: 'Brand not found' },
        { status: 404 }
      )
    }

    // Create the book
    const book = await db.book.create({
      data: {
        brandId,
        title,
        subtitle,
        author,
        isbn,
        asin,
        description,
        publishDate: publishDate ? new Date(publishDate) : null,
        category,
        price: price ? parseFloat(price) : null,
        currency: currency || 'USD',
        amazonUrl,
        kindleUrl,
        audibleUrl,
        barnesNobleUrl,
        coverImage,
        isActive: true,
      },
    })

    return NextResponse.json({
      success: true,
      book: {
        id: book.id,
        title: book.title,
        author: book.author,
        createdAt: book.createdAt.toISOString(),
      },
    })
  } catch (error) {
    console.error('[API /api/books] Create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create book' },
      { status: 500 }
    )
  }
}
