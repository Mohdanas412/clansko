import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/feed', '/explore', '/messages', '/profile', '/onboarding']

export async function middleware(req) {
  const res = NextResponse.next()
  const { pathname } = req.nextUrl

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return req.cookies.get(name)?.value },
        set(name, value, options) { res.cookies.set({ name, value, ...options }) },
        remove(name, options) { res.cookies.set({ name, value: '', ...options }) },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  const isProtectedRoute = PROTECTED_ROUTES.some(r => pathname.startsWith(r))

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if ((pathname === '/login' || pathname === '/signup') && session) {
  return NextResponse.redirect(new URL('/feed', req.url))
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
    '/login',
    '/signup',
  ],
}