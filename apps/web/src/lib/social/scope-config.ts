// Centralized OAuth Scope Configuration
// Change env vars to switch between basic (dev) and full (App Review approved) scopes
// META_SCOPE_MODE: 'basic' | 'page' — defaults to 'basic'
// LINKEDIN_SCOPE_MODE: 'personal' | 'organization' — defaults to 'personal'

export type MetaScopeMode = 'basic' | 'page'
export type LinkedInScopeMode = 'personal' | 'organization'

export function getMetaScopeMode(): MetaScopeMode {
  return (process.env.META_SCOPE_MODE as MetaScopeMode) || 'basic'
}

export function getLinkedInScopeMode(): LinkedInScopeMode {
  return (process.env.LINKEDIN_SCOPE_MODE as LinkedInScopeMode) || 'personal'
}

export function getFacebookScopes(): string[] {
  if (getMetaScopeMode() === 'page') {
    return [
      'public_profile',
      'email',
      'pages_show_list',
      'pages_read_engagement',
      'pages_manage_posts',
    ]
  }
  return ['public_profile', 'email']
}

export function getInstagramScopes(): string[] {
  if (getMetaScopeMode() === 'page') {
    return [
      'public_profile',
      'email',
      'pages_show_list',
      'instagram_basic',
      'instagram_content_publish',
    ]
  }
  return ['public_profile', 'email']
}

export function getThreadsScopes(): string[] {
  if (getMetaScopeMode() === 'page') {
    return ['threads_basic', 'threads_content_publish']
  }
  return ['public_profile', 'email']
}

export function getLinkedInScopes(): string[] {
  if (getLinkedInScopeMode() === 'organization') {
    return [
      'openid',
      'profile',
      'email',
      'w_member_social',
      'w_organization_social',
      'r_organization_social',
      'rw_organization_admin',
    ]
  }
  return ['openid', 'profile', 'email', 'w_member_social']
}

// Whether Threads should use its own OAuth endpoint vs Facebook's
export function useThreadsOAuth(): boolean {
  return getMetaScopeMode() === 'page'
}
