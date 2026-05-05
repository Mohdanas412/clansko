// app/api/users/update/route.js
// Updates a user's profile — called during onboarding and profile edits

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Required for Vercel — this route uses cookies() so can't be static
export const dynamic = 'force-dynamic'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { userId, college, branch, year, bio, skills, looking_for, onboarding_done } = body

    if (!userId)
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })

    const updates = { updated_at: new Date().toISOString() }
    if (college !== undefined)          updates.college = college
    if (branch !== undefined)           updates.branch = branch
    if (year !== undefined)             updates.year = year
    if (bio !== undefined)              updates.bio = bio
    if (skills !== undefined)           updates.skills = skills
    if (looking_for !== undefined)      updates.looking_for = looking_for
    if (onboarding_done !== undefined)  updates.onboarding_done = onboarding_done

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 200 })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}