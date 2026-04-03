/**
 * Builds OAuth redirect paths based on whether the user came from the portal or admin dashboard.
 */
export function getOAuthRedirectPath(opts: {
  source: string | undefined
  brandSlug: string
  platform: string
  result: 'success' | 'error' | 'selectPage' | 'selectOrg'
  errorDetail?: string
}): string {
  const { source, brandSlug, platform, result, errorDetail } = opts
  const isPortal = source === 'portal'

  if (isPortal) {
    const base = `/portal/${brandSlug}?tab=social`
    switch (result) {
      case 'success':
        return `${base}&success=${platform}_connected`
      case 'selectPage':
        return `${base}&selectPage=${platform}`
      case 'selectOrg':
        return `${base}&selectOrg=${platform}`
      case 'error':
        return `${base}&error=${errorDetail || `${platform}_callback_failed`}`
    }
  }

  // Admin dashboard paths
  const base = `/brands/${brandSlug}/settings?tab=social`
  switch (result) {
    case 'success':
      return `${base}&success=${platform}_connected`
    case 'selectPage':
      return `${base}&selectPage=${platform}`
    case 'selectOrg':
      return `${base}&selectOrg=${platform}`
    case 'error':
      return `/settings?error=${errorDetail || `${platform}_callback_failed`}`
  }
}
