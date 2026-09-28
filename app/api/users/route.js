// app/api/users/route.js
// GET — Fetch all users except the current authenticated user.
// Auth is required — user ID is derived strictly from the session cookie,
// never from a client-supplied query parameter.

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

export async function GET() {
  try {
    const supabase = getSupabase()

    // Derive the current user from the session — never trust client-supplied IDs
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Return all onboarded users except the caller.
    // Only expose public directory fields — never email or auth metadata.
    const { data, error } = await supabase
      .from('users')
      .select('id, name, college, branch, year, bio, skills, looking_for, profile_photo, created_at')
      .neq('id', user.id)
      .eq('onboarding_done', true)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}