// app/api/users/update/route.js
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function PATCH(request) {
  try {
    const body = await request.json()
    console.log('Update API received body:', body)

    const {
      userId,
      college,
      branch,
      year,
      bio,
      skills,
      looking_for,
      onboarding_done,
    } = body

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    const updates = {
      updated_at: new Date().toISOString(),
    }
    if (college !== undefined)         updates.college = college
    if (branch !== undefined)          updates.branch = branch
    if (year !== undefined)            updates.year = year
    if (bio !== undefined)             updates.bio = bio
    if (skills !== undefined)          updates.skills = skills
    if (looking_for !== undefined)     updates.looking_for = looking_for
    if (onboarding_done !== undefined) updates.onboarding_done = onboarding_done

    console.log('Running update with:', { userId, updates })

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log('Update success:', data)
    return NextResponse.json({ data }, { status: 200 })

  } catch (err) {
    console.error('Server error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}