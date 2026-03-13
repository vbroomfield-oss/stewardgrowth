import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/auth/callback',
  '/auth/reset-password',
  '/terms',
  '/privacy',
  '/pricing',
  '/view',
]

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip API routes, static files, and public assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/sdk') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    const { response } = await updateSession(request)
    return response
  }

  const { response, user } = await updateSession(request)

  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname === route)

  // Redirect unauthenticated users to login
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/login', request.url)
    if (pathname !== '/') {
      redirectUrl.searchParams.set('redirectTo', pathname)
    }
    return NextResponse.redirect(redirectUrl)
  }

  // Redirect authenticated users away from auth pages
  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
