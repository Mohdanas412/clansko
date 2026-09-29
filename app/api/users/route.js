// app/api/users/route.js
// GET — Fetch a bounded page of users except the current authenticated user.
// Auth is required — user ID is derived strictly from the session cookie,
// never from a client-supplied query parameter.

export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request) {
  try {
    const supabase = await getSupabaseServerClient()

    // Derive the current user from the session — never trust client-supplied IDs
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }


    const { searchParams } = new URL(request.url)
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '24', 10)
    const requestedPage = Number.parseInt(searchParams.get('page') || '0', 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 24
    const page = Number.isFinite(requestedPage) && requestedPage >= 0 ? requestedPage : 0
    const from = page * limit

    // Fetch one extra record to determine whether another page exists without a
    // costly exact count. Only public directory fields are exposed.
    const { data: usersWithExtra, error } = await supabase
      .from('users')
      .select('id, name, college, branch, year, bio, skills, looking_for, profile_photo, created_at')
      .neq('id', user.id)
      .eq('onboarding_done', true)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + limit)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const hasMore = (usersWithExtra?.length || 0) > limit
    const data = hasMore ? usersWithExtra.slice(0, limit) : (usersWithExtra || [])
    return NextResponse.json({
      data,
      nextCursor: hasMore ? String(page + 1) : null,
      hasMore,
    }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}