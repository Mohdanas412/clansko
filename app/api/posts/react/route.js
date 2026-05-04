// app/api/posts/react/route.js
// POST → toggle a reaction on a post
// Logic:
//   - If user has NOT reacted to this post → add reaction
//   - If user reacted with SAME type → remove it (toggle off)
//   - If user reacted with DIFFERENT type → swap to new type

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

// Valid reaction types — matches your design system
const VALID_TYPES = ['fire', 'eyes', 'handshake']

export async function POST(request) {
  try {
    const { userId, postId, type } = await request.json()

    // 1. Validate inputs
    if (!userId || !postId || !type) {
      return NextResponse.json(
        { error: 'userId, postId, and type are required.' },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // 2. Check if this user already reacted to this post
    //    A user can only have ONE reaction per post (any type)
    const { data: existing, error: fetchError } = await supabase
      .from('reactions')
      .select('id, type')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single()

    // fetchError with code PGRST116 means "no rows found" — that's fine
    // Any other error is a real problem
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Reaction fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // 3. Toggle logic
    if (!existing) {
      // Case A: No existing reaction → INSERT new one
      const { data, error } = await supabase
        .from('reactions')
        .insert({
          post_id: postId,
          user_id: userId,
          type,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data: { action: 'added', reaction: data }
      }, { status: 200 })

    } else if (existing.type === type) {
      // Case B: Same reaction type → DELETE (toggle off)
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data: { action: 'removed', type }
      }, { status: 200 })

    } else {
      // Case C: Different reaction type → UPDATE to new type
      const { data, error } = await supabase
        .from('reactions')
        .update({ type })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        data: { action: 'swapped', reaction: data }
      }, { status: 200 })
    }

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}