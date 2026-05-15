// app/api/posts/create/route.js
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
    // meaning anyone could create posts attributed to any user ID they wanted.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    // ✅ userId removed from destructuring — we use user.id from auth session
    const { title, description, stage, looking_for } = await request.json()
 
    if (!title || !description || !stage) {
      return NextResponse.json(
        { error: 'title, description, and stage are required.' },
        { status: 400 }
      )
    }
 
    const lookingForArray = Array.isArray(looking_for) ? looking_for : []
 
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,          // ✅ always from auth session
        title,
        description,
        stage,
        looking_for: lookingForArray,
        view_count: 0,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()
 
    if (error) {
      console.error('Post create error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
 
    return NextResponse.json({ data }, { status: 200 })
 
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}