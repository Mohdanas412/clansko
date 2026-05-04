// app/api/connections/request/route.js
// POST — Send a connection request from one user to another

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Same pattern as all other API routes — server client inside the function
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

export async function POST(request) {
  try {
    const { senderId, receiverId, message } = await request.json()

    // Basic validation
    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'senderId and receiverId are required.' },
        { status: 400 }
      )
    }

    // Can't connect with yourself
    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'You cannot connect with yourself.' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Check if a connection already exists in EITHER direction
    // (A→B and B→A should both count as "already exists")
    const { data: existing, error: checkError } = await supabase
      .from('connections')
      .select('id, status')
      .or(
        `and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`
      )
      .maybeSingle() // maybeSingle returns null (not error) if no row found

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: `Connection already exists with status: ${existing.status}` },
        { status: 409 } // 409 = Conflict
      )
    }

    // Create the connection request
    const { data, error } = await supabase
      .from('connections')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        status: 'pending',
        message: message?.trim() || null, // optional message
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
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