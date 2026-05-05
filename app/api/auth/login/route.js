// app/api/auth/login/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 400 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('id, name, onboarding_done')
      .eq('email', email)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
    }

    return NextResponse.json({
      data: {
        userId: userProfile.id,
        name: userProfile.name,
        onboardingDone: userProfile.onboarding_done,
      }
    }, { status: 200 })

  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}