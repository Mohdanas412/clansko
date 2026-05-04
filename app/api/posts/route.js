// app/api/posts/route.js
// GET all posts, joined with author info from users table
// Ordered by newest first

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

export async function GET() {
  try {
    const supabase = getSupabase()

    // 1. Fetch all posts
    //    The "users:user_id ( ... )" syntax is Supabase's way of doing a JOIN
    //    It says: for each post, also fetch these fields from the users table
    //    where users.id = posts.user_id
    const { data: posts, error } = await supabase
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
      .order('created_at', { ascending: false })  // newest first

    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 2. For each post, also fetch reaction counts grouped by type
    //    and total comment count
    //    We do this with a second query and merge manually
    const postIds = posts.map(p => p.id)

    // Fetch all reactions for these posts in one query
    const { data: reactions } = await supabase
      .from('reactions')
      .select('post_id, type')
      .in('post_id', postIds)

    // Fetch all comment counts for these posts in one query
    const { data: comments } = await supabase
      .from('comments')
      .select('post_id')
      .in('post_id', postIds)

    // 3. Build a map: postId → { fire: N, eyes: N, handshake: N }
    const reactionMap = {}
    const commentMap = {}

    postIds.forEach(id => {
      reactionMap[id] = { fire: 0, eyes: 0, handshake: 0 }
      commentMap[id] = 0
    })

    reactions?.forEach(r => {
      if (reactionMap[r.post_id] && r.type in reactionMap[r.post_id]) {
        reactionMap[r.post_id][r.type]++
      }
    })

    comments?.forEach(c => {
      commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1
    })

    // 4. Merge counts into each post object
    const enrichedPosts = posts.map(post => ({
      ...post,
      reactions: reactionMap[post.id] || { fire: 0, eyes: 0, handshake: 0 },
      comment_count: commentMap[post.id] || 0,
    }))

    return NextResponse.json({ data: enrichedPosts }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}