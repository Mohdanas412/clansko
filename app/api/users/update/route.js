// app/api/users/update/route.js
// PATCH /api/users/update
// Called when user completes onboarding OR edits their profile
// Updates the users table with the new data

import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request) {
  try {
    const body = await request.json()

    // Pull out everything we might want to update
    const {
      userId,
      college,
      branch,
      year,
      bio,
      skills,        // array of strings e.g. ["React", "Node.js"]
      looking_for,   // string e.g. "Co-founder", "Designer"
      onboarding_done,
    } = body

    // userId is required — we need to know WHO to update
    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    // Build update object — only include fields that were actually sent
    const updates = {
      updated_at: new Date().toISOString(),
    }
    if (college !== undefined)          updates.college = college
    if (branch !== undefined)           updates.branch = branch
    if (year !== undefined)             updates.year = year
    if (bio !== undefined)              updates.bio = bio
    if (skills !== undefined)           updates.skills = skills
    if (looking_for !== undefined)      updates.looking_for = looking_for
    if (onboarding_done !== undefined)  updates.onboarding_done = onboarding_done

    // Run the update in Supabase
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()       // returns the updated row
      .single()

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update profile.' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 200 })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}