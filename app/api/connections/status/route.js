// app/api/connections/status/route.js
// GET /api/connections/status?profile_id=xxx
// Returns the connection status between the authenticated user and a given profile.
// Used by the profile page to show Connect / Pending / Message buttons.
 
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
 
export async function GET(request) {
  try {
    const supabase = getSupabase()
 
    // ✅ Auth check — user ID comes from session, not the request
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    const { searchParams } = new URL(request.url)
    const profileId = searchParams.get('profile_id')
 
    if (!profileId) {
      return NextResponse.json({ error: 'profile_id is required.' }, { status: 400 })
    }
 
    // Viewing own profile — no connection record needed
    if (profileId === user.id) {
      return NextResponse.json({ data: { isOwnProfile: true } }, { status: 200 })
    }
 
    // ✅ Look up connection in both directions (user may be sender or receiver)
    const { data: connection } = await supabase
      .from('connections')
      .select('id, status, sender_id, receiver_id')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${profileId}),` +
        `and(sender_id.eq.${profileId},receiver_id.eq.${user.id})`
      )
      .maybeSingle()
 
    if (!connection) {
      // No connection exists yet
      return NextResponse.json({
        data: { status: null, connectionId: null }
      }, { status: 200 })
    }
 
    return NextResponse.json({
      data: {
        status: connection.status,
        connectionId: connection.id,
        // Let the frontend know if the current user is the receiver
        // (so it can decide whether to show "Accept" vs "Request Sent")
        isReceiver: connection.receiver_id === user.id,
      }
    }, { status: 200 })
 
  } catch (err) {
    console.error('Connection status error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}