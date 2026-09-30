import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Routes that require login
const PROTECTED_ROUTES = ['/feed', '/explore', '/messages', '/profile', '/onboarding', '/goals']

// Routes that require onboarding to be complete
// (user can't skip onboarding by clicking nav links)
const ONBOARDING_REQUIRED_ROUTES = ['/feed', '/explore', '/messages', '/profile', '/goals']

export async function middleware(req) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = req.nextUrl
  const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname.startsWith(r))

  // Rule 1 — Not logged in, trying to access protected route → send to login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Rule 2 — Already logged in, trying to visit login/signup → send to feed
  if ((pathname === '/login' || pathname === '/signup') && user) {
    return NextResponse.redirect(new URL('/feed', req.url))
  }

  // Rule 3 — Logged in but onboarding not done → lock to /onboarding
  // This prevents skipping onboarding by clicking nav links
  if (user && ONBOARDING_REQUIRED_ROUTES.some(r => pathname.startsWith(r))) {
    // Fetch onboarding status from users table
    const { data: profile } = await supabase
      .from('users')
      .select('onboarding_done')
      .eq('id', user.id)
      .single()

    // If profile exists and onboarding is NOT done → redirect to onboarding
    if (profile && profile.onboarding_done === false) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    '/feed/:path*',
    '/explore/:path*',
    '/messages/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
    '/goals/:path*',
    '/login',
    '/signup',
  ],
}