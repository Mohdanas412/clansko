// app/api/connections/respond/route.js
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
 
const VALID_STATUSES = ['accepted', 'rejected']
 
export async function PATCH(request) {
  try {
    const supabase = getSupabase()
 
    // ✅ FIX: Auth check was missing entirely. userId was trusted from the body,
    // meaning anyone could accept/reject connection requests on behalf of any user.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    // ✅ userId removed — we use user.id from auth session
    const { connectionId, status, action } = await request.json()
 
    // Support both `status` (explore page) and `action` (profile page) formats
    const resolvedStatus = status || (action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : null)
 
    if (!connectionId || !resolvedStatus) {
      return NextResponse.json(
        { error: 'connectionId and status (or action) are required.' },
        { status: 400 }
      )
    }
 
    if (!VALID_STATUSES.includes(resolvedStatus)) {
      return NextResponse.json(
        { error: 'Status must be "accepted" or "rejected".' },
        { status: 400 }
      )
    }
 
    // Fetch the connection to verify it exists
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('id, sender_id, receiver_id, status')
      .eq('id', connectionId)
      .single()
 
    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found.' }, { status: 404 })
    }
 
    // ✅ FIX: Ownership check now uses user.id from auth session, not body.
    // Only the receiver can accept or reject.
    if (connection.receiver_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the receiver can respond to a connection request.' },
        { status: 403 }
      )
    }
 
    if (connection.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot respond — request is already ${connection.status}.` },
        { status: 409 }
      )
    }
 
    const { data, error } = await supabase
      .from('connections')
      .update({
        status: resolvedStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', connectionId)
      .select()
      .single()
 
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
 
    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
