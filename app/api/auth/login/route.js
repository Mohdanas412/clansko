// app/api/auth/login/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { applyRateLimit } from '@/lib/ratelimit'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) {
          try { cookieStore.set({ name, value, ...options }) } catch {}
        },
        remove(name, options) {
          try { cookieStore.set({ name, value: '', ...options }) } catch {}
        },
      },
    }
  )
}

export async function POST(request) {
  // Rate limit: 5 attempts per minute per IP
  const rl = await applyRateLimit(request, 'login')
  if (!rl.success) return rl.response

  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 })
    }

    // Password authentication is sufficient here. A profile query can be denied by
    // RLS or be briefly unavailable after signup; neither must invalidate a session.
    return NextResponse.json({
      data: { userId: authData.user.id }
    }, { status: 200 })

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}