// app/api/messages/send/route.js
// POST /api/messages/send
// Inserts a new message into the messages table
// Body: { connectionId, content }  ← senderId removed, comes from auth session
 
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
        set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
        remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
      },
    }
  )
}
 
export async function POST(request) {
  try {
    const supabase = getSupabase()
 
    // ✅ FIX: Get sender identity from the auth session, never from request body.
    // Previously the client sent senderId which could be set to any user's ID,
    // allowing anyone to impersonate another user.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    // ✅ senderId removed from destructuring — we use user.id from auth session
    const { connectionId, content } = await request.json()
 
    if (!connectionId || !content) {
      return NextResponse.json(
        { error: 'connectionId and content are required.' },
        { status: 400 }
      )
    }
 
    const trimmed = content.trim()
    if (trimmed.length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 })
    }
    if (trimmed.length > 1000) {
      return NextResponse.json({ error: 'Message must be under 1000 characters.' }, { status: 400 })
    }
 
    // Verify the connection exists and is accepted
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
 
    // ✅ FIX: Participant check now uses user.id from auth session, not client body.
    // Even if someone sent a forged senderId, this check uses the real identity.
    const isParticipant =
      connection.sender_id === user.id || connection.receiver_id === user.id
 
    if (!isParticipant) {
      return NextResponse.json({ error: 'You are not part of this connection.' }, { status: 403 })
    }
 
    // Insert the message using user.id as sender_id (not from client)
    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert({
        connection_id: connectionId,
        sender_id: user.id,           // ✅ always from auth session
        content: trimmed,
        is_read: false,
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
 
    return NextResponse.json({ data: message }, { status: 200 })
 
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}