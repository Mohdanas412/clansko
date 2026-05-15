// app/api/posts/react/route.js
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
 
const VALID_TYPES = ['fire', 'eyes', 'handshake']
 
export async function POST(request) {
  try {
    const supabase = getSupabase()
 
    // ✅ FIX: Auth check was missing entirely. userId was trusted from the body,
    // meaning anyone could react as any user by passing an arbitrary userId.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    // ✅ userId removed from destructuring — we use user.id from auth session
    const { postId, type } = await request.json()
 
    if (!postId || !type) {
      return NextResponse.json(
        { error: 'postId and type are required.' },
        { status: 400 }
      )
    }
 
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Invalid reaction type. Must be one of: ${VALID_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
 
    // Check if this user already reacted to this post
    const { data: existing, error: fetchError } = await supabase
      .from('reactions')
      .select('id, type')
      .eq('post_id', postId)
      .eq('user_id', user.id)   // ✅ always from auth session
      .single()
 
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Reaction fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }
 
    if (!existing) {
      // Case A: No existing reaction → INSERT
      const { data, error } = await supabase
        .from('reactions')
        .insert({
          post_id: postId,
          user_id: user.id,      // ✅ always from auth session
          type,
          created_at: new Date().toISOString(),
        })
        .select()
        .single()
 
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
 
      return NextResponse.json({ data: { action: 'added', reaction: data } }, { status: 200 })
 
    } else if (existing.type === type) {
      // Case B: Same type → DELETE (toggle off)
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existing.id)
 
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
 
      return NextResponse.json({ data: { action: 'removed', type } }, { status: 200 })
 
    } else {
      // Case C: Different type → UPDATE
      const { data, error } = await supabase
        .from('reactions')
        .update({ type })
        .eq('id', existing.id)
        .select()
        .single()
 
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
 
      return NextResponse.json({ data: { action: 'swapped', reaction: data } }, { status: 200 })
    }
 
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}