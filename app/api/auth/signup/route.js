// app/api/auth/signup/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { applyRateLimit } from '@/lib/ratelimit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request) {
  // Rate limit check per IP
  const rl = await applyRateLimit(request, 'signup')
  if (!rl.success) return rl.response

  try {
    const body = await request.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON request payload.' }, { status: 400 })
    }

    const { name, email, password } = body

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 100) {
      return NextResponse.json({ error: 'Name must be between 1 and 100 characters.' }, { status: 400 })
    }
    if (typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''
    if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { name: name.trim() },
      },
    })

    if (authError || !authData?.user) {
      return NextResponse.json({ error: authError?.message || 'Unable to create your account.' }, { status: 400 })
    }

    // Ensure the profile record exists in public.users (including non-null email field)
    const { error: profileError } = await supabase.from('users').upsert({
      id: authData.user.id,
      name: name.trim(),
      email: normalizedEmail,
      onboarding_done: false,
    }, { onConflict: 'id' })

    if (profileError) {
      console.error('Profile creation error during signup:', profileError)
    }

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
