// app/api/auth/signup/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { applyRateLimit } from '@/lib/ratelimit'

// Helper — creates supabase server client with cookie access
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
  // Rate limit: 3 attempts per hour per IP
  const rl = await applyRateLimit(request, 'signup')
  if (!rl.success) return rl.response

  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be between 1 and 100 characters.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!normalizedEmail) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 })
    }

    const supabase = getSupabase()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        // The database trigger uses this metadata to create the matching profile.
        data: { name: name.trim() },
      },
    })

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || 'Unable to create your account.' }, { status: 400 })
    }

    // Profile creation belongs to the auth.users database trigger. Doing a second
    // client-scoped insert here fails under RLS and can create orphaned auth users.
    return NextResponse.json({
      data: {
        userId: authData.user.id,
        requiresEmailConfirmation: !authData.session,
      },
    }, { status: 200 })

  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}