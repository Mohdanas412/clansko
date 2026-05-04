// app/api/messages/send/route.js
// POST /api/messages/send
// Inserts a new message into the messages table
// Body: { connectionId, senderId, content }

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

export async function POST(request) {
  try {
    // 1. Parse the request body
    const { connectionId, senderId, content } = await request.json()

    // 2. Validate all required fields
    if (!connectionId || !senderId || !content) {
      return NextResponse.json(
        { error: 'connectionId, senderId, and content are required.' },
        { status: 400 }
      )
    }

    // 3. Trim and check content isn't empty or too long
    const trimmed = content.trim()
    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
    }
    if (trimmed.length > 1000) {
      return NextResponse.json({ error: 'Message must be under 1000 characters.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // 4. Verify the connection exists, is accepted, and the sender is part of it
    //    This prevents someone from sending messages to a connection they don't belong to
    const { data: connection, error: connError } = await supabase
      .from('connections')
      .select('id, sender_id, receiver_id, status')
      .eq('id', connectionId)
      .single()

    if (connError || !connection) {
      return NextResponse.json({ error: 'Connection not found.' }, { status: 404 })
    }

    if (connection.status !== 'accepted') {
      return NextResponse.json({ error: 'Cannot message — connection is not accepted.' }, { status: 403 })
    }

    // 5. Make sure senderId is actually part of this connection
    const isParticipant =
      connection.sender_id === senderId || connection.receiver_id === senderId

    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not part of this connection.' }, { status: 403 })
    }

    // 6. Insert the message
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: senderId,
        content: trimmed,
        is_read: false,              // new messages start as unread
        created_at: new Date().toISOString(),
      })
      .select(`
        id,
        content,
        is_read,
        created_at,
        sender_id,
        sender:sender_id ( id, name, profile_photo )
      `)
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 7. Return the full message object (with sender info)
    //    The chat UI will use this for optimistic display
    return NextResponse.json({ data: message }, { status: 200 })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}