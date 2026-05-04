// app/api/users/route.js
// GET — Fetch all users except the current user
// Usage: /api/users?userId=abc123

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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Fetch all users EXCEPT the current user
    // Only return fields needed for the explore card — not sensitive stuff
    const { data, error } = await supabase
      .from('users')
      .select('id, name, college, branch, year, bio, skills, looking_for, profile_photo, created_at')
      .neq('id', userId)           // neq = "not equal" — excludes current user
      .eq('onboarding_done', true) // only show users who completed onboarding
      .order('created_at', { ascending: false }) // newest members first

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}