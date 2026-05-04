// app/api/posts/create/route.js
// API route to create a new post in the posts table

import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Helper: build a Supabase server client (same pattern as your auth routes)
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
    // 1. Parse request body
    const { userId, title, description, stage, looking_for } = await request.json()

    // 2. Validate required fields
    if (!userId || !title || !description || !stage) {
      return NextResponse.json(
        { error: 'userId, title, description, and stage are required.' },
        { status: 400 }
      )
    }

    // 3. looking_for must be an array (matches your text[] column)
    //    If not passed, default to empty array
    const lookingForArray = Array.isArray(looking_for) ? looking_for : []

    const supabase = getSupabase()

    // 4. Insert post into posts table
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title,
        description,
        stage,
        looking_for: lookingForArray,
        view_count: 0,
        created_at: new Date().toISOString(),
      })
      .select()   // returns the inserted row
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