// app/api/goals/update/route.js
// PATCH → mark a goal as done or pending
//         when marked done → increment streak_count
//         when marked pending → decrement streak_count (min 0)

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
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )
}

// ─── PATCH /api/goals/update ──────────────────────────────────────────────────
export async function PATCH(request) {
  try {
    const { goalId, userId, status } = await request.json()

    // Validate all required fields
    if (!goalId || !userId || !status)
      return NextResponse.json(
        { error: 'goalId, userId, and status are required.' },
        { status: 400 }
      )

    // Only two valid statuses
    if (status !== 'done' && status !== 'pending')
      return NextResponse.json(
        { error: 'Status must be "done" or "pending".' },
        { status: 400 }
      )

    const supabase = getSupabase()

    // Step 1 — fetch the existing goal
    // We need current streak_count to increment/decrement it
    const { data: goal, error: fetchError } = await supabase
      .from('goals')
      .select('id, user_id, status, streak_count')
      .eq('id', goalId)
      .single()

    if (fetchError || !goal)
      return NextResponse.json({ error: 'Goal not found.' }, { status: 404 })

    // Step 2 — make sure this goal belongs to the user making the request
    if (goal.user_id !== userId)
      return NextResponse.json(
        { error: 'You can only update your own goals.' },
        { status: 403 }
      )

    // Step 3 — calculate new streak_count
    // marking done   → streak goes UP by 1
    // marking pending → streak goes DOWN by 1 (never below 0)
    let newStreak = goal.streak_count
    if (status === 'done' && goal.status !== 'done') {
      // only increment if it wasn't already done (prevent double-counting)
      newStreak = goal.streak_count + 1
    } else if (status === 'pending' && goal.status === 'done') {
      // only decrement if it was previously done (un-checking)
      newStreak = Math.max(0, goal.streak_count - 1)
    }
    // if status is same as current → streak doesn't change

    // Step 4 — update the goal in the database
    const { data, error: updateError } = await supabase
      .from('goals')
      .update({
        status:       status,
        streak_count: newStreak,
        updated_at:   new Date().toISOString(),
      })
      .eq('id', goalId)
      .select()
      .single()

    if (updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}