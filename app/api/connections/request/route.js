// app/api/connections/request/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { validateConnectionRequest } from '@/lib/validation'

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient()

    // Auth check — senderId always comes from the verified session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body = await request.json()

    // Validate receiverId and optional message (max 300 chars)
    const validation = validateConnectionRequest(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const { receiverId, message } = validation.value

    // Can't connect with yourself
    if (user.id === receiverId) {
      return NextResponse.json({ error: 'You cannot connect with yourself.' }, { status: 400 })
    }

    // Check if a connection already exists in either direction
    const { data: existing, error: checkError } = await supabase
      .from('connections')
      .select('id, status')
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${receiverId}),` +
        `and(sender_id.eq.${receiverId},receiver_id.eq.${user.id})`
      )
      .maybeSingle()

    if (checkError) {
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existing) {
      return NextResponse.json(
        { error: `Connection already exists with status: ${existing.status}` },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('connections')
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        status: 'pending',
        message,
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
