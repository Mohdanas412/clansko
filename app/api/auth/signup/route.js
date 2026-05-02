// app/api/auth/signup/route.js
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password })

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    const userId = authData.user.id

    const { error: dbError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        name,
        onboarding_done: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    if (dbError) {
      console.error('DB insert error:', dbError)
      return NextResponse.json({ error: 'Signup failed. Please try again.' }, { status: 500 })
    }

    return NextResponse.json({ data: { userId } }, { status: 200 })

  } catch (err) {
    console.error('Signup error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}