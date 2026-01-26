export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/funding/check - Check if brand has sufficient funds for an action
// This is called BEFORE any ad spend or campaign launch
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
    const { brandId, amount, action, campaignId } = body

    if (!brandId || !amount || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // In production: Check actual database balance
    const mockBalance = {
      available: 7300,
      reserved: 1200,
      dailyRemaining: 343, // Daily cap - spent today
      monthlyRemaining: 3766, // Monthly cap - spent this month
    }

    const canProceed = mockBalance.available >= amount
    const withinDailyCap = mockBalance.dailyRemaining >= amount
    const withinMonthlyCap = mockBalance.monthlyRemaining >= amount

    if (!canProceed) {
      return NextResponse.json({
        success: true,
        data: {
          approved: false,
          reason: 'INSUFFICIENT_FUNDS',
          message: `Insufficient funds. Available: $${mockBalance.available}, Required: $${amount}`,
          availableBalance: mockBalance.available,
          requiredAmount: amount,
          shortfall: amount - mockBalance.available,
          action: 'DEPOSIT_REQUIRED',
        },
      })
    }

    if (!withinDailyCap) {
      return NextResponse.json({
        success: true,
        data: {
          approved: false,
          reason: 'DAILY_CAP_EXCEEDED',
          message: `Would exceed daily spend cap. Remaining today: $${mockBalance.dailyRemaining}`,
          dailyRemaining: mockBalance.dailyRemaining,
          requiredAmount: amount,
          action: 'WAIT_OR_INCREASE_CAP',
        },
      })
    }

    if (!withinMonthlyCap) {
      return NextResponse.json({
        success: true,
        data: {
          approved: false,
          reason: 'MONTHLY_CAP_EXCEEDED',
          message: `Would exceed monthly budget. Remaining: $${mockBalance.monthlyRemaining}`,
          monthlyRemaining: mockBalance.monthlyRemaining,
          requiredAmount: amount,
          action: 'INCREASE_BUDGET',
        },
      })
    }

    // Reserve the funds
    // In production: Create a reservation record in the database
    const reservationId = `res_${Date.now()}`

    return NextResponse.json({
      success: true,
      data: {
        approved: true,
        reservationId,
        amount,
        brandId,
        action,
        campaignId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hour hold
        message: 'Funds reserved successfully',
      },
    })
  } catch (error) {
    console.error('Error checking funds:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to check funds' },
      { status: 500 }
    )
  }
}
