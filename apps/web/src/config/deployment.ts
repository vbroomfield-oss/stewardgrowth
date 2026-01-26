/**
 * Deployment Configuration
 *
 * StewardGrowth can run in different modes:
 * 1. LOCAL - Development on localhost
 * 2. INTERNAL - Private deployment for Steward products only
 * 3. PUBLIC - Full public SaaS with billing
 */

export type DeploymentMode = 'local' | 'internal' | 'public'

export interface DeploymentConfig {
  mode: DeploymentMode
  allowPublicSignup: boolean
  requireFounderCode: boolean
  enableBilling: boolean
  enableAnalytics: boolean
  restrictedAccess: boolean
}

// Determine deployment mode from environment
function getDeploymentMode(): DeploymentMode {
  const mode = process.env.DEPLOYMENT_MODE?.toLowerCase()

  if (mode === 'public') return 'public'
  if (mode === 'internal') return 'internal'

  // Default to local in development
  if (process.env.NODE_ENV === 'development') return 'local'

  // Default to internal for safety
  return 'internal'
}

export function getDeploymentConfig(): DeploymentConfig {
  const mode = getDeploymentMode()

  switch (mode) {
    case 'local':
      return {
        mode: 'local',
        allowPublicSignup: true, // For testing
        requireFounderCode: false, // Skip for dev convenience
        enableBilling: false, // No real payments in dev
        enableAnalytics: false, // No tracking locally
        restrictedAccess: false,
      }

    case 'internal':
      return {
        mode: 'internal',
        allowPublicSignup: false, // Only invited users
        requireFounderCode: true, // Must have founder code
        enableBilling: false, // No fees for internal
        enableAnalytics: true, // Track for insights
        restrictedAccess: true, // IP/auth restricted
      }

    case 'public':
      return {
        mode: 'public',
        allowPublicSignup: true,
        requireFounderCode: false, // Optional for discounts
        enableBilling: true, // Real payments
        enableAnalytics: true,
        restrictedAccess: false,
      }
  }
}

/**
 * Product Types
 */
export type ProductType = 'saas' | 'book' | 'service' | 'course'

/**
 * Internal Brands Configuration
 *
 * These are your Steward SaaS products that get special treatment:
 * - No platform fees
 * - No ad spend margin
 * - Priority features
 * - Direct founder access
 *
 * Marketing funds are STILL required for these brands.
 */
export const INTERNAL_BRANDS = [
  {
    slug: 'stewardmax',
    name: 'StewardMAX',
    description: 'Church Management Software',
    website: 'https://stewardmax.com',
    industry: 'church_software',
    productType: 'saas' as ProductType,
    status: 'active',
  },
  {
    slug: 'stewardring',
    name: 'StewardRing',
    description: 'Cloud Phone System for Churches',
    website: 'https://stewardring.com',
    industry: 'church_software',
    productType: 'saas' as ProductType,
    status: 'development',
  },
  {
    slug: 'stewardpro',
    name: 'StewardPro',
    description: 'Professional Services Management',
    website: 'https://stewardpro.com',
    industry: 'b2b_saas',
    productType: 'saas' as ProductType,
    status: 'planned',
  },
  {
    slug: 'stewardgrowth',
    name: 'StewardGrowth',
    description: 'AI Marketing Platform',
    website: 'https://stewardgrowth.com',
    industry: 'b2b_saas',
    productType: 'saas' as ProductType,
    status: 'active',
  },
]

/**
 * Internal Books Configuration
 *
 * Books get the same fee-free treatment as SaaS products:
 * - No platform fees on Amazon Ads management
 * - No margin on ad spend
 * - Marketing funds STILL required
 */
export const INTERNAL_BOOKS = [
  {
    slug: 'kingdom-leadership',
    title: 'Kingdom Leadership',
    author: 'Vincent Broomfield',
    category: 'christian_leadership',
    amazonAsin: '',
    status: 'published',
  },
  {
    slug: 'digital-church',
    title: 'The Digital Church',
    author: 'Vincent Broomfield',
    category: 'church_technology',
    amazonAsin: '',
    status: 'published',
  },
  {
    slug: 'saas-for-churches',
    title: 'SaaS for Churches',
    author: 'Vincent Broomfield',
    category: 'business',
    amazonAsin: '',
    status: 'pre-launch',
  },
]

/**
 * Check if a book is internal (your books)
 */
export function isInternalBook(bookSlug: string): boolean {
  return INTERNAL_BOOKS.some(b => b.slug.toLowerCase() === bookSlug.toLowerCase())
}

/**
 * Check if a brand is internal (Steward product)
 */
export function isInternalBrand(brandSlug: string): boolean {
  return INTERNAL_BRANDS.some(b => b.slug.toLowerCase() === brandSlug.toLowerCase())
}

/**
 * Get internal brand config
 */
export function getInternalBrand(brandSlug: string) {
  return INTERNAL_BRANDS.find(b => b.slug.toLowerCase() === brandSlug.toLowerCase())
}

/**
 * IP Allowlist for internal deployment
 * Add your IPs here for restricted access
 */
export const IP_ALLOWLIST: string[] = [
  // Add your home/office IPs
  // '123.45.67.89',
]

/**
 * Check if request is from allowed IP
 */
export function isAllowedIP(ip: string): boolean {
  const config = getDeploymentConfig()

  // No restriction needed
  if (!config.restrictedAccess) return true

  // Allow all in local mode
  if (config.mode === 'local') return true

  // Check allowlist
  if (IP_ALLOWLIST.length === 0) return true // Empty list = allow all
  return IP_ALLOWLIST.includes(ip)
}

/**
 * Deployment checklist for going public
 */
export const PUBLIC_LAUNCH_CHECKLIST = [
  {
    category: 'Infrastructure',
    items: [
      { task: 'Set up production Supabase project', required: true },
      { task: 'Configure production database', required: true },
      { task: 'Set up Redis for rate limiting', required: true },
      { task: 'Configure CDN for assets', required: false },
      { task: 'Set up error monitoring (Sentry)', required: true },
    ],
  },
  {
    category: 'Billing',
    items: [
      { task: 'Create Stripe account', required: true },
      { task: 'Configure subscription products in Stripe', required: true },
      { task: 'Set up webhook endpoints', required: true },
      { task: 'Test payment flow end-to-end', required: true },
      { task: 'Configure tax settings', required: false },
    ],
  },
  {
    category: 'Security',
    items: [
      { task: 'Security audit of authentication', required: true },
      { task: 'API rate limiting configured', required: true },
      { task: 'CORS policy set correctly', required: true },
      { task: 'Environment variables secured', required: true },
      { task: 'Penetration testing', required: false },
    ],
  },
  {
    category: 'Marketing',
    items: [
      { task: 'Landing page live', required: true },
      { task: 'Pricing page complete', required: true },
      { task: 'Documentation/help center', required: true },
      { task: 'Terms of Service', required: true },
      { task: 'Privacy Policy', required: true },
    ],
  },
  {
    category: 'Operations',
    items: [
      { task: 'Support email configured', required: true },
      { task: 'Monitoring dashboards set up', required: true },
      { task: 'Backup strategy in place', required: true },
      { task: 'Incident response plan', required: false },
    ],
  },
]

/**
 * Environment variable requirements by mode
 */
export const REQUIRED_ENV_VARS: Record<DeploymentMode, string[]> = {
  local: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  internal: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'OPENAI_API_KEY',
  ],
  public: [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'DATABASE_URL',
    'OPENAI_API_KEY',
    'ANTHROPIC_API_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'GOOGLE_ADS_CLIENT_ID',
    'META_APP_ID',
  ],
}

/**
 * Validate environment for deployment mode
 */
export function validateEnvironment(): { valid: boolean; missing: string[] } {
  const mode = getDeploymentMode()
  const required = REQUIRED_ENV_VARS[mode]
  const missing: string[] = []

  for (const envVar of required) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}
