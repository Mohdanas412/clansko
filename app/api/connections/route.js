// app/api/connections/route.js
// GET — Fetch all connections for a given user (sent + received)

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
    // Get userId from query params: /api/connections?userId=abc123
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // Fetch connections where user is the SENDER
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

    // Fetch connections where user is the RECEIVER
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

    // Normalize both arrays into a flat format the frontend can easily use
    // Each item will have: connectionId, status, direction, otherUser
    const sentNormalized = (sent || []).map(c => ({
      connectionId: c.id,
      status: c.status,
      direction: 'sent',       // I sent this request
      message: c.message,
      createdAt: c.created_at,
      otherUser: c.receiver,   // the person I sent it to
    }))

    const receivedNormalized = (received || []).map(c => ({
      connectionId: c.id,
      status: c.status,
      direction: 'received',   // I received this request
      message: c.message,
      createdAt: c.created_at,
      otherUser: c.sender,     // the person who sent it to me
    }))

    const allConnections = [...sentNormalized, ...receivedNormalized]

    return NextResponse.json({ data: allConnections }, { status: 200 })
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}