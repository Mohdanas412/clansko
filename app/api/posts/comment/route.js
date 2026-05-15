// app/api/posts/comment/route.js
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
 
export async function POST(request) {
  try {
    const supabase = getSupabase()
 
    // ✅ FIX: Auth check was missing entirely. userId was trusted from the body,
    // meaning anyone could post comments attributed to any other user.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    // ✅ userId removed from destructuring — we use user.id from auth session
    const { postId, content } = await request.json()
 
    if (!postId || !content) {
      return NextResponse.json(
        { error: 'postId and content are required.' },
        { status: 400 }
      )
    }
 
    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      return NextResponse.json({ error: 'Comment cannot be empty.' }, { status: 400 })
    }
    if (trimmedContent.length > 500) {
      return NextResponse.json({ error: 'Comment must be under 500 characters.' }, { status: 400 })
    }
 
    // Insert comment using user.id from auth session
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,          // ✅ always from auth session
        content: trimmedContent,
        created_at: new Date().toISOString(),
      })
      .select('id, content, created_at, user_id')
      .single()
 
    if (insertError) {
      console.error('Comment insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }
 
    // Fetch commenter profile for immediate UI append (use verified user.id)
    const { data: author, error: authorError } = await supabase
      .from('users')
      .select('id, name, profile_photo')
      .eq('id', user.id)           // ✅ always from auth session
      .single()
 
    if (authorError) {
      console.error('Author fetch error:', authorError)
      return NextResponse.json({ data: { ...newComment, users: null } }, { status: 200 })
    }
 
    return NextResponse.json({
      data: { ...newComment, users: author }
    }, { status: 200 })
 
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}