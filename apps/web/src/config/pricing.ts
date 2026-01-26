/**
 * StewardGrowth Pricing Configuration
 *
 * Revenue Model:
 * 1. Platform Subscription Fee - Monthly access to StewardGrowth
 * 2. Ad Spend Margin - Percentage on managed ad spend
 * 3. AI Credits - Usage-based AI features beyond limits
 *
 * Internal brands use founder codes to waive subscription fees
 * but still require marketing fund deposits.
 */

export type PricingTier = 'starter' | 'growth' | 'enterprise' | 'internal'

export interface PricingPlan {
  id: PricingTier
  name: string
  description: string
  monthlyPrice: number
  annualPrice: number // Price per month when paid annually
  adSpendMargin: number // Percentage taken on managed ad spend
  features: string[]
  limits: {
    brands: number
    users: number
    eventsPerMonth: number
    aiCreditsPerMonth: number
    adPlatforms: number
  }
  stripePriceId?: {
    monthly: string
    annual: string
  }
}

export const PRICING_PLANS: Record<PricingTier, PricingPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For small teams getting started with growth marketing',
    monthlyPrice: 299,
    annualPrice: 249, // ~17% discount
    adSpendMargin: 0.15, // 15%
    features: [
      'Up to 2 SaaS brands',
      '3 team members',
      'Basic analytics dashboard',
      'AI content generation (50/month)',
      'Google Ads integration',
      'Meta Ads integration',
      'Email support',
      'Weekly KPI reports',
    ],
    limits: {
      brands: 2,
      users: 3,
      eventsPerMonth: 100000,
      aiCreditsPerMonth: 50,
      adPlatforms: 2,
    },
    stripePriceId: {
      monthly: 'price_starter_monthly',
      annual: 'price_starter_annual',
    },
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    description: 'For growing companies scaling their marketing',
    monthlyPrice: 799,
    annualPrice: 649, // ~19% discount
    adSpendMargin: 0.12, // 12%
    features: [
      'Up to 5 SaaS brands',
      '10 team members',
      'Advanced analytics & attribution',
      'AI content generation (200/month)',
      'All ad platform integrations',
      'SEO automation',
      'Approval workflows',
      'Priority support',
      'Daily KPI reports',
      'Custom dashboards',
      'StewardRing integration',
    ],
    limits: {
      brands: 5,
      users: 10,
      eventsPerMonth: 500000,
      aiCreditsPerMonth: 200,
      adPlatforms: 4,
    },
    stripePriceId: {
      monthly: 'price_growth_monthly',
      annual: 'price_growth_annual',
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with complex marketing needs',
    monthlyPrice: 2499,
    annualPrice: 1999, // ~20% discount
    adSpendMargin: 0.10, // 10%
    features: [
      'Unlimited SaaS brands',
      'Unlimited team members',
      'Full analytics suite',
      'Unlimited AI generation',
      'All ad platforms + custom',
      'Advanced SEO & content AI',
      'Custom approval workflows',
      'Dedicated account manager',
      'Real-time KPI alerts',
      'Custom integrations',
      'White-label options',
      'SLA guarantee',
      'SSO/SAML',
      'Audit logs',
    ],
    limits: {
      brands: -1, // Unlimited
      users: -1, // Unlimited
      eventsPerMonth: -1, // Unlimited
      aiCreditsPerMonth: -1, // Unlimited
      adPlatforms: -1, // Unlimited
    },
    stripePriceId: {
      monthly: 'price_enterprise_monthly',
      annual: 'price_enterprise_annual',
    },
  },

  internal: {
    id: 'internal',
    name: 'Internal (Founder)',
    description: 'For Steward SaaS products - service fees waived',
    monthlyPrice: 0,
    annualPrice: 0,
    adSpendMargin: 0, // No margin on internal brands
    features: [
      'All Enterprise features',
      'No service fees',
      'No ad spend margin',
      'Direct founder access',
      'Priority development requests',
    ],
    limits: {
      brands: -1,
      users: -1,
      eventsPerMonth: -1,
      aiCreditsPerMonth: -1,
      adPlatforms: -1,
    },
  },
}

/**
 * Founder/Internal Codes
 *
 * These codes waive all StewardGrowth service fees for internal Steward products.
 * Marketing fund deposits are still REQUIRED - this only waives the platform fee.
 */
export interface FounderCode {
  code: string
  name: string
  tier: 'internal'
  createdAt: Date
  expiresAt?: Date
  maxUses?: number
  currentUses: number
  allowedBrands?: string[] // Specific brand slugs, or undefined for any
  notes?: string
}

// Predefined founder codes (in production, store in database with hashed values)
export const FOUNDER_CODES: Record<string, Omit<FounderCode, 'code'>> = {
  // Primary founder code for all Steward products
  'STEWARD-FOUNDER-2024': {
    name: 'Steward Founder Access',
    tier: 'internal',
    createdAt: new Date('2024-01-01'),
    currentUses: 0,
    allowedBrands: ['stewardmax', 'stewardring', 'stewardpro', 'stewardgrowth'],
    notes: 'Full access for all Steward SaaS products',
  },

  // Development/testing code
  'STEWARD-DEV-TEST': {
    name: 'Development Testing',
    tier: 'internal',
    createdAt: new Date('2024-01-01'),
    expiresAt: new Date('2025-12-31'),
    maxUses: 10,
    currentUses: 0,
    notes: 'For development and testing only',
  },
}

/**
 * Validate a founder code
 */
export function validateFounderCode(
  code: string,
  brandSlug?: string
): { valid: boolean; error?: string; codeData?: Omit<FounderCode, 'code'> } {
  const normalizedCode = code.toUpperCase().trim()
  const codeData = FOUNDER_CODES[normalizedCode]

  if (!codeData) {
    return { valid: false, error: 'Invalid code' }
  }

  // Check expiration
  if (codeData.expiresAt && new Date() > codeData.expiresAt) {
    return { valid: false, error: 'Code has expired' }
  }

  // Check max uses
  if (codeData.maxUses && codeData.currentUses >= codeData.maxUses) {
    return { valid: false, error: 'Code has reached maximum uses' }
  }

  // Check brand restriction
  if (brandSlug && codeData.allowedBrands && !codeData.allowedBrands.includes(brandSlug.toLowerCase())) {
    return { valid: false, error: 'Code not valid for this brand' }
  }

  return { valid: true, codeData }
}

/**
 * Calculate total cost for a subscription
 */
export function calculateSubscriptionCost(
  tier: PricingTier,
  billingCycle: 'monthly' | 'annual',
  adSpend: number = 0
): {
  platformFee: number
  adSpendMargin: number
  total: number
  savings?: number
} {
  const plan = PRICING_PLANS[tier]

  const platformFee = billingCycle === 'annual'
    ? plan.annualPrice
    : plan.monthlyPrice

  const adSpendMargin = adSpend * plan.adSpendMargin

  const total = platformFee + adSpendMargin

  // Calculate savings for annual
  const savings = billingCycle === 'annual'
    ? (plan.monthlyPrice - plan.annualPrice) * 12
    : undefined

  return {
    platformFee,
    adSpendMargin,
    total,
    savings,
  }
}

/**
 * Get plan limits
 */
export function getPlanLimits(tier: PricingTier) {
  return PRICING_PLANS[tier].limits
}

/**
 * Check if a usage is within plan limits
 */
export function checkPlanLimit(
  tier: PricingTier,
  limitType: keyof PricingPlan['limits'],
  currentUsage: number
): { allowed: boolean; limit: number; remaining: number } {
  const limit = PRICING_PLANS[tier].limits[limitType]

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, remaining: -1 }
  }

  return {
    allowed: currentUsage < limit,
    limit,
    remaining: Math.max(0, limit - currentUsage),
  }
}

/**
 * Feature comparison for pricing page
 */
export const FEATURE_COMPARISON = [
  {
    category: 'Brands & Users',
    features: [
      { name: 'SaaS Brands', starter: '2', growth: '5', enterprise: 'Unlimited' },
      { name: 'Team Members', starter: '3', growth: '10', enterprise: 'Unlimited' },
    ],
  },
  {
    category: 'Analytics',
    features: [
      { name: 'Events/month', starter: '100K', growth: '500K', enterprise: 'Unlimited' },
      { name: 'Attribution Modeling', starter: 'Basic', growth: 'Advanced', enterprise: 'Custom' },
      { name: 'Real-time Dashboard', starter: false, growth: true, enterprise: true },
      { name: 'Custom Reports', starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: 'AI Features',
    features: [
      { name: 'Content Generation', starter: '50/mo', growth: '200/mo', enterprise: 'Unlimited' },
      { name: 'SEO Recommendations', starter: 'Basic', growth: 'Advanced', enterprise: 'Full Suite' },
      { name: 'Ad Creative AI', starter: false, growth: true, enterprise: true },
      { name: 'Marketing Advisor', starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: 'Integrations',
    features: [
      { name: 'Google Ads', starter: true, growth: true, enterprise: true },
      { name: 'Meta Ads', starter: true, growth: true, enterprise: true },
      { name: 'LinkedIn Ads', starter: false, growth: true, enterprise: true },
      { name: 'TikTok Ads', starter: false, growth: true, enterprise: true },
      { name: 'StewardRing', starter: false, growth: true, enterprise: true },
      { name: 'Custom Integrations', starter: false, growth: false, enterprise: true },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Email Support', starter: true, growth: true, enterprise: true },
      { name: 'Priority Support', starter: false, growth: true, enterprise: true },
      { name: 'Dedicated Account Manager', starter: false, growth: false, enterprise: true },
      { name: 'SLA Guarantee', starter: false, growth: false, enterprise: true },
    ],
  },
]
