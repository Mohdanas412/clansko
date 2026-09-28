// app/api/users/[id]/route.js
// GET /api/users/:id
// Fetches a single user's public profile by their userId
// Requires an authenticated session — unauthenticated callers receive 401.

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

export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Require a valid session — prevents unauthenticated profile scraping
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Only return public profile fields — never email or auth metadata
    const { data, error } = await supabase
      .from('users')
      .select('id, name, college, branch, year, bio, skills, looking_for, profile_photo, created_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    return NextResponse.json({ data }, { status: 200 })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}