export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/funding/deposit - Create a Stripe checkout session for funding
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { brandId, amount, currency = 'usd' } = body

    // Validate
    if (!brandId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid brand ID or amount' },
        { status: 400 }
      )
    }

    // Minimum deposit
    if (amount < 100) {
      return NextResponse.json(
        { success: false, error: 'Minimum deposit is $100' },
        { status: 400 }
      )
    }

    // In production: Create Stripe checkout session
    // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    // const session = await stripe.checkout.sessions.create({
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency,
    //       product_data: {
    //         name: `Marketing Fund Deposit - ${brandId}`,
    //         description: 'Pre-funded marketing budget for ad spend',
    //       },
    //       unit_amount: amount * 100, // Stripe uses cents
    //     },
    //     quantity: 1,
    //   }],
    //   mode: 'payment',
    //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/brands/${brandId}/funding?success=true`,
    //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/brands/${brandId}/funding?canceled=true`,
    //   metadata: {
    //     brandId,
    //     userId: user.id,
    //     type: 'marketing_fund_deposit',
    //   },
    // })

    // Mock response
    const checkoutUrl = `https://checkout.stripe.com/mock-session?amount=${amount}&brand=${brandId}`

    return NextResponse.json({
      success: true,
      data: {
        checkoutUrl,
        sessionId: `cs_mock_${Date.now()}`,
      },
    })
  } catch (error) {
    console.error('Error creating deposit session:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create deposit session' },
      { status: 500 }
    )
  }
}
