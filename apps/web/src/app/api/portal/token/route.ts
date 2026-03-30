export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { db } from '@/lib/db'

// POST /api/portal/token - Generate a shareable portal link
export async function POST(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!['OWNER', 'ADMIN', 'MANAGER'].includes(userOrg.role)) {
      return NextResponse.json({ error: 'Only admins can generate portal links' }, { status: 403 })
    }

    const { brandSlug, label, expiresInDays } = await request.json()

    if (!brandSlug) {
      return NextResponse.json({ error: 'brandSlug is required' }, { status: 400 })
    }

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: brandSlug,
        deletedAt: null,
      },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
      : undefined

    const portalToken = await db.portalToken.create({
      data: {
        brandId: brand.id,
        createdById: userOrg.id,
        label: label || `${brand.name} portal link`,
        expiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.tech'
    const viewUrl = `${appUrl}/view/${portalToken.token}`

    return NextResponse.json({
      success: true,
      token: portalToken.token,
      url: viewUrl,
      expiresAt: portalToken.expiresAt,
    })
  } catch (error) {
    console.error('[Portal Token] Error:', error)
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 })
  }
}

// GET /api/portal/token - List tokens for a brand
export async function GET(request: NextRequest) {
  try {
    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const brandSlug = searchParams.get('brandSlug')

    if (!brandSlug) {
      return NextResponse.json({ error: 'brandSlug is required' }, { status: 400 })
    }

    const brand = await db.saaSBrand.findFirst({
      where: {
        organizationId: userOrg.organizationId,
        slug: brandSlug,
        deletedAt: null,
      },
    })

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 })
    }

    const tokens = await db.portalToken.findMany({
      where: { brandId: brand.id, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        token: true,
        label: true,
        createdAt: true,
        expiresAt: true,
        lastUsedAt: true,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://stewardgrowth.tech'

    return NextResponse.json({
      success: true,
      tokens: tokens.map(t => ({
        ...t,
        url: `${appUrl}/view/${t.token}`,
        isExpired: t.expiresAt ? new Date() > t.expiresAt : false,
      })),
    })
  } catch (error) {
    console.error('[Portal Token] Error:', error)
    return NextResponse.json({ error: 'Failed to list tokens' }, { status: 500 })
  }
}
