// app/api/connections/respond/route.js
// PATCH — Accept or reject a pending connection request

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
    const { connectionId, userId, status } = await request.json()

    // Validation
    if (!connectionId || !userId || !status) {
      return NextResponse.json(
        { error: 'connectionId, userId, and status are required.' },
        { status: 400 }
      )
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: 'Status must be "accepted" or "rejected".' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Fetch the connection to verify it exists and userId is the receiver
    const { data: connection, error: fetchError } = await supabase
      .from('connections')
      .select('id, sender_id, receiver_id, status')
      .eq('id', connectionId)
      .single()

    if (fetchError || !connection) {
      return NextResponse.json({ error: 'Connection not found.' }, { status: 404 })
    }

    // Only the receiver can accept or reject
    if (connection.receiver_id !== userId) {
      return NextResponse.json(
        { error: 'Only the receiver can respond to a connection request.' },
        { status: 403 } // 403 = Forbidden
      )
    }

    // Can only respond to a pending request
    if (connection.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot respond — request is already ${connection.status}.` },
        { status: 409 }
      )
    }

    // Update the status
    const { data, error } = await supabase
      .from('connections')
      .update({
        status,
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