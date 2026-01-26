/**
 * Funding Guard
 *
 * This module ensures that all marketing spend is properly funded.
 * It provides functions to check, reserve, and release funds before any action.
 *
 * CRITICAL: No ad spend or campaign launch should occur without passing through this guard.
 */

export interface FundingCheckResult {
  approved: boolean
  reason?: string
  message?: string
  reservationId?: string
  shortfall?: number
  availableBalance?: number
}

export interface FundingStatus {
  brandId: string
  status: 'funded' | 'low' | 'depleted' | 'paused'
  available: number
  reserved: number
  canMarket: boolean
  blockedReasons: string[]
}

/**
 * Check if a brand has sufficient funds for an action
 */
export async function checkFunds(
  brandId: string,
  amount: number,
  action: string
): Promise<FundingCheckResult> {
  const response = await fetch('/api/funding/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandId, amount, action }),
  })

  const data = await response.json()
  return data.data
}

/**
 * Get the funding status for a brand
 */
export async function getFundingStatus(brandId: string): Promise<FundingStatus> {
  const response = await fetch(`/api/funding/balance?brandId=${brandId}`)
  const data = await response.json()

  const balance = data.data
  const blockedReasons: string[] = []

  if (balance.available <= 0) {
    blockedReasons.push('No available funds')
  }
  if (balance.status === 'paused') {
    blockedReasons.push('Marketing manually paused')
  }
  if (balance.available < balance.limits?.minimumBalance) {
    blockedReasons.push('Below minimum balance threshold')
  }

  return {
    brandId,
    status: balance.status,
    available: balance.available,
    reserved: balance.reserved,
    canMarket: blockedReasons.length === 0,
    blockedReasons,
  }
}

/**
 * Reserve funds for a pending action (campaign launch, ad spend, etc.)
 * Returns a reservation ID that must be used to confirm or release the funds.
 */
export async function reserveFunds(
  brandId: string,
  amount: number,
  action: string,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; reservationId?: string; error?: string }> {
  const check = await checkFunds(brandId, amount, action)

  if (!check.approved) {
    return { success: false, error: check.message }
  }

  // In production: Create reservation record
  return {
    success: true,
    reservationId: check.reservationId
  }
}

/**
 * Confirm a fund reservation (actually deduct the funds)
 * Called when the action is successfully completed (e.g., ad was served)
 */
export async function confirmReservation(
  reservationId: string
): Promise<{ success: boolean; error?: string }> {
  // In production: Convert reservation to actual spend
  // Update balance, create transaction record
  return { success: true }
}

/**
 * Release a fund reservation (cancel the hold)
 * Called when the action fails or is canceled
 */
export async function releaseReservation(
  reservationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  // In production: Release the reserved funds back to available
  return { success: true }
}

/**
 * Marketing Action Guard
 *
 * Wraps any marketing action to ensure proper funding.
 * Use this for all ad spend, campaign launches, and budget changes.
 */
export async function withFundingGuard<T>(
  brandId: string,
  estimatedCost: number,
  action: string,
  execute: (reservationId: string) => Promise<T>
): Promise<{ success: boolean; result?: T; error?: string }> {
  // Step 1: Reserve funds
  const reservation = await reserveFunds(brandId, estimatedCost, action)

  if (!reservation.success) {
    return { success: false, error: reservation.error }
  }

  try {
    // Step 2: Execute the action
    const result = await execute(reservation.reservationId!)

    // Step 3: Confirm the reservation
    await confirmReservation(reservation.reservationId!)

    return { success: true, result }
  } catch (error) {
    // Step 4: Release funds if action fails
    await releaseReservation(
      reservation.reservationId!,
      error instanceof Error ? error.message : 'Unknown error'
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Action failed'
    }
  }
}

/**
 * Monthly Budget Requirements
 *
 * Each brand must have sufficient funds deposited before the month begins.
 * This function checks if a brand meets the minimum funding requirements.
 */
export interface MonthlyBudgetRequirement {
  brandId: string
  requiredAmount: number
  currentBalance: number
  isFunded: boolean
  shortfall: number
  dueDate: string
}

export async function checkMonthlyBudgetRequirement(
  brandId: string
): Promise<MonthlyBudgetRequirement> {
  // In production: Get brand's monthly budget setting and current balance
  const mockData = {
    requiredAmount: 10000, // Monthly budget
    currentBalance: 8500,
    dueDate: '2024-02-01',
  }

  return {
    brandId,
    requiredAmount: mockData.requiredAmount,
    currentBalance: mockData.currentBalance,
    isFunded: mockData.currentBalance >= mockData.requiredAmount,
    shortfall: Math.max(0, mockData.requiredAmount - mockData.currentBalance),
    dueDate: mockData.dueDate,
  }
}
