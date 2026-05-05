// app/api/messages/read/route.js
// Marks all unread messages in a conversation as is_read = true
// Called when a user opens a chat — clears the unread badge

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

export async function PATCH(request) {
  try {
    const { connectionId, userId } = await request.json()

    if (!connectionId || !userId)
      return NextResponse.json({ error: 'connectionId and userId are required.' }, { status: 400 })

    const supabase = getSupabase()

    // Mark all messages in this conversation as read
    // BUT only messages NOT sent by this user (you can't "read" your own messages)
    const { error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('connection_id', connectionId)
      .neq('sender_id', userId)        // only mark OTHER person's messages as read
      .eq('is_read', false)            // only update the ones not already read

    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ data: { success: true } }, { status: 200 })

  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}