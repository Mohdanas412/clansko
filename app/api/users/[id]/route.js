// app/api/users/[id]/route.js
// GET /api/users/:id
// Fetches a single user's public profile by their userId
// Requires an authenticated session — unauthenticated callers receive 401.

export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams?.id

    if (!id) {
      return NextResponse.json({ error: 'User ID is required.' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

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