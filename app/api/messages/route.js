// app/api/messages/route.js
// GET /api/messages?connectionId=xxx
// Returns all messages for a given connection, oldest first
 
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
 
export async function GET(request) {
  try {
    const supabase = getSupabase()
 
    // ✅ FIX: Verify auth session first — user ID comes from the server,
    // not from anything the client sends. Previously missing entirely.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')
 
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required.' }, { status: 400 })
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
      return NextResponse.json({ error: 'Connection is not accepted.' }, { status: 403 })
    }
 
    // ✅ FIX: Verify the authenticated user is actually part of this connection.
    // Previously the route returned messages to anyone who knew the connectionId.
    const isParticipant =
      connection.sender_id === user.id || connection.receiver_id === user.id
 
    if (!isParticipant) {
      return NextResponse.json({ error: 'Not authorized.' }, { status: 403 })
    }
 
    // Fetch all messages for this connection, oldest first
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        is_read,
        created_at,
        sender_id,
        sender:sender_id ( id, name, profile_photo )
      `)
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true })
 
    if (msgError) {
      return NextResponse.json({ error: msgError.message }, { status: 500 })
    }
 
    return NextResponse.json({
      data: {
        messages: messages || [],
        senderId: connection.sender_id,
        receiverId: connection.receiver_id,
      }
    }, { status: 200 })
 
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}