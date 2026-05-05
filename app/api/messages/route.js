// app/api/messages/route.js
// GET /api/messages?connectionId=xxx
// Returns all messages for a given connection, oldest first

export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Same pattern used across all route files
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
    // 1. Get connectionId from query param
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // 2. Verify the connection exists and is accepted
    //    We don't want people reading messages from rejected/pending connections
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

    // 3. Fetch all messages for this connection, oldest first
    //    We also grab sender info (name + photo) so the UI can show who said what
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

    // 4. Also return both user IDs from the connection
    //    The frontend uses this to know which side is "me" vs "them"
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