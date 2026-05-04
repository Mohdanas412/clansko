// app/api/posts/[id]/route.js
// GET a single post by ID
// Returns: post + author info + all comments (with commenter info) + reactions

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

export async function GET(request, { params }) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 })
    }

    const supabase = getSupabase()

    // 1. Fetch the post with author info (same join pattern as route.js)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select(`
        id,
        title,
        description,
        stage,
        looking_for,
        view_count,
        created_at,
        user_id,
        users:user_id (
          id,
          name,
          college,
          profile_photo
        )
      `)
      .eq('id', id)
      .single()

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found.' }, { status: 404 })
    }

    // 2. Fetch all comments for this post
    //    Also join with users table to get commenter name + photo
    const { data: comments, error: commentsError } = await supabase
      .from('comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        users:user_id (
          id,
          name,
          profile_photo
        )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true })  // oldest comment first

    if (commentsError) {
      console.error('Comments fetch error:', commentsError)
      // Don't fail the whole request — just return empty comments
    }

    // 3. Fetch all reactions for this post
    const { data: reactions, error: reactionsError } = await supabase
      .from('reactions')
      .select('id, type, user_id')
      .eq('post_id', id)

    if (reactionsError) {
      console.error('Reactions fetch error:', reactionsError)
    }

    // 4. Group reactions by type: { fire: N, eyes: N, handshake: N }
    //    Also keep track of which userIds reacted with what
    //    (frontend needs this to highlight which reaction current user picked)
    const reactionCounts = { fire: 0, eyes: 0, handshake: 0 }
    const reactionsByUser = {}  // { userId: 'fire' | 'eyes' | 'handshake' }

    reactions?.forEach(r => {
      if (r.type in reactionCounts) {
        reactionCounts[r.type]++
      }
      reactionsByUser[r.user_id] = r.type
    })

    // 5. Increment view count (fire and forget — don't await, don't block response)
    supabase
      .from('posts')
      .update({ view_count: (post.view_count || 0) + 1 })
      .eq('id', id)
      .then()  // intentionally not awaited

    // 6. Build final response object
    const result = {
      ...post,
      comments: comments || [],
      reactions: reactionCounts,
      reactions_by_user: reactionsByUser,
    }

    return NextResponse.json({ data: result }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}