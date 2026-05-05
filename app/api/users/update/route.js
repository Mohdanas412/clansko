// app/api/users/update/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { userId, college, branch, year, bio, skills, looking_for, onboarding_done } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    // Create fresh client directly — avoids any singleton issues on Vercel
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const updates = { updated_at: new Date().toISOString() }
    if (college !== undefined)         updates.college = college
    if (branch !== undefined)          updates.branch = branch
    if (year !== undefined)            updates.year = year
    if (bio !== undefined)             updates.bio = bio
    if (skills !== undefined)          updates.skills = skills
    if (looking_for !== undefined)     updates.looking_for = looking_for
    if (onboarding_done !== undefined) updates.onboarding_done = onboarding_done

    console.log('Updating userId:', userId)
    console.log('Updates:', updates)

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}