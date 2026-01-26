import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/funding/balance - Get funding balance for a brand
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const brandId = searchParams.get('brandId')

    if (!brandId) {
      return NextResponse.json(
        { success: false, error: 'Brand ID required' },
        { status: 400 }
      )
    }

    // In production: Query database for actual balance
    // Calculate: total deposits - total spend - reserved

    const mockBalance = {
      brandId,
      balance: 8500,
      available: 7300, // balance - reserved
      reserved: 1200,
      monthlyBudget: 10000,
      spent: {
        total: 6234,
        byPlatform: {
          google_ads: 2805,
          meta_ads: 1870,
          linkedin_ads: 935,
          tiktok_ads: 624,
        },
      },
      status: 'funded', // funded, low, depleted, paused
      autoFund: {
        enabled: true,
        threshold: 2000,
        amount: 5000,
        paymentMethodId: 'pm_xxxx',
      },
      limits: {
        dailySpendCap: 500,
        monthlySpendCap: 10000,
        cpaThreshold: 100,
        roasThreshold: 2.0,
      },
    }

    return NextResponse.json({
      success: true,
      data: mockBalance,
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
