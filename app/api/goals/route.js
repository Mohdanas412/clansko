// app/api/goals/route.js
// GET  → fetch goals for a user for a given week
// POST → create a new goal for the current week

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Same pattern used across all API routes in ClanSko
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

// ─── GET /api/goals?userId=xxx&weekKey=2025-W18 ───────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId  = searchParams.get('userId')
    const weekKey = searchParams.get('weekKey')

    // Both params are required
    if (!userId || !weekKey)
      return NextResponse.json({ error: 'userId and weekKey are required.' }, { status: 400 })

    const supabase = getSupabase()

    const { data, error } = await supabase
      .from('goals')
      .select('id, goal_text, week_key, status, streak_count, created_at, updated_at')
      .eq('user_id', userId)
      .eq('week_key', weekKey)
      .order('created_at', { ascending: true }) // oldest goal first

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: data || [] }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}

// ─── POST /api/goals ──────────────────────────────────────────────────────────
export async function POST(request) {
  try {
    const { userId, goalText, weekKey } = await request.json()

    // Validate all fields
    if (!userId || !goalText || !weekKey)
      return NextResponse.json({ error: 'userId, goalText, and weekKey are required.' }, { status: 400 })

    const trimmed = goalText.trim()
    if (trimmed.length === 0)
      return NextResponse.json({ error: 'Goal text cannot be empty.' }, { status: 400 })
    if (trimmed.length > 200)
      return NextResponse.json({ error: 'Goal must be under 200 characters.' }, { status: 400 })

    const supabase = getSupabase()

    // Max 3 goals per week per user — check count first
    const { data: existing, error: countError } = await supabase
      .from('goals')
      .select('id')
      .eq('user_id', userId)
      .eq('week_key', weekKey)

    if (countError) return NextResponse.json({ error: countError.message }, { status: 500 })

    if (existing && existing.length >= 3)
      return NextResponse.json({ error: 'You can only set 3 goals per week.' }, { status: 400 })

    // Insert the new goal
    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id:      userId,
        goal_text:    trimmed,
        week_key:     weekKey,
        status:       'pending',   // always starts as pending
        streak_count: 0,           // streak starts at 0
        created_at:   new Date().toISOString(),
        updated_at:   new Date().toISOString(),
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}