export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getUserWithOrganization } from '@/lib/auth/get-user-org'
import { PRICING_PLANS } from '@/config/pricing'

export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to environment variables.' },
        { status: 503 }
      )
    }

    const userOrg = await getUserWithOrganization()
    if (!userOrg) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    // Dynamic import to avoid errors when stripe isn't installed
    const Stripe = (await import('stripe')).default
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16' as any,
    })

    const body = await request.json().catch(() => ({}))
    const { priceId, tier = 'growth' } = body

    // Use provided priceId or look up from pricing config
    const plan = PRICING_PLANS[tier as keyof typeof PRICING_PLANS]
    const selectedPriceId = priceId || plan?.stripePriceId?.monthly

    if (!selectedPriceId) {
      return NextResponse.json(
        { success: false, error: 'No price ID configured for this plan. Create Stripe products first.' },
        { status: 400 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: selectedPriceId, quantity: 1 }],
      customer_email: userOrg.email,
      success_url: `${appUrl}/settings?tab=billing&upgraded=true`,
      cancel_url: `${appUrl}/settings?tab=billing`,
      metadata: {
        orgId: userOrg.organizationId,
        userId: userOrg.id,
        tier,
      },
    })

    return NextResponse.json({ success: true, url: session.url })
  } catch (error: any) {
    console.error('[Billing] Checkout error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
