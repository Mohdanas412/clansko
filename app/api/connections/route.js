// app/api/connections/route.js
// GET — Fetch all connections for the current authenticated user (sent + received).
// Auth is required — user ID is derived strictly from the session cookie,
// never from a client-supplied query parameter.

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

export async function GET() {
  try {
    const supabase = getSupabase()

    // Derive the current user from the session — never trust client-supplied IDs
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const userId = user.id

    // Fetch connections where the current user is the SENDER
    const { data: sent, error: sentError } = await supabase
      .from('connections')
      .select(`
        id, status, message, created_at,
        receiver:receiver_id ( id, name, college, branch, year, bio, skills, looking_for, profile_photo )
      `)
      .eq('sender_id', userId)

    if (sentError) {
      return NextResponse.json({ error: sentError.message }, { status: 500 })
    }

    // Fetch connections where the current user is the RECEIVER
    const { data: received, error: receivedError } = await supabase
      .from('connections')
      .select(`
        id, status, message, created_at,
        sender:sender_id ( id, name, college, branch, year, bio, skills, looking_for, profile_photo )
      `)
      .eq('receiver_id', userId)

    if (receivedError) {
      return NextResponse.json({ error: receivedError.message }, { status: 500 })
    }

    // Normalize both arrays into a flat format the frontend can easily use.
    // Each item will have: connectionId, status, direction, otherUser
    const sentNormalized = (sent || []).map(c => ({
      connectionId: c.id,
      status: c.status,
      direction: 'sent',
      message: c.message,
      createdAt: c.created_at,
      otherUser: c.receiver,
    }))

    const receivedNormalized = (received || []).map(c => ({
      connectionId: c.id,
      status: c.status,
      direction: 'received',
      message: c.message,
      createdAt: c.created_at,
      otherUser: c.sender,
    }))

    return NextResponse.json({ data: [...sentNormalized, ...receivedNormalized] }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}