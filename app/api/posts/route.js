// app/api/posts/route.js
// GET all posts (or filtered by user_id), joined with author info
// Ordered by newest first
 
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
 
export async function GET(request) {
  try {
    const supabase = getSupabase()
 
    // ✅ FIX: Auth check was missing entirely.
    // Previously anyone could call this endpoint and read all posts + author data.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
 
    // ✅ NEW: Optional ?user_id= filter so profile pages can fetch a single
    // user's posts via this same route instead of querying the DB directly.
    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get('user_id')
 
    let query = supabase
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
      .order('created_at', { ascending: false })
 
    // Apply user filter only when provided (profile page use case)
    if (filterUserId) {
      query = query.eq('user_id', filterUserId)
    }
 
    const { data: posts, error } = await query
 
    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
 
    if (!posts || posts.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 })
    }
 
    const postIds = posts.map(p => p.id)

    // ✅ FIX (Task 0.4): Replace the feed's per-post /api/projects/:id waterfall.
    // Previously the feed fired one HTTP request per post (20 posts = 21 HTTP
    // roundtrips, ~81 DB queries). Now all related data is fetched in 3 parallel
    // queries and embedded directly on each post object.
    const [
      { data: reactions },
      { data: comments },
      { data: rawMembers },
    ] = await Promise.all([
      supabase
        .from('reactions')
        .select('post_id, type, user_id')
        .in('post_id', postIds),
      supabase
        .from('comments')
        .select('id, post_id, content, created_at, users:user_id(name, profile_photo)')
        .in('post_id', postIds)
        .order('created_at', { ascending: true }),
      supabase
        .from('project_members')
        .select('id, project_id, user_id, role, status, users:user_id(id, name, college, profile_photo)')
        .in('project_id', postIds)
        .eq('status', 'accepted'),
    ])

    // Build lookup maps in O(n) — no nested loops
    const reactionMap = {}
    const commentMap = {}
    const teamMap = {}

    postIds.forEach(id => {
      reactionMap[id] = []
      commentMap[id] = []
      teamMap[id] = []
    })

    reactions?.forEach(r => { reactionMap[r.post_id]?.push(r) })
    comments?.forEach(c => { commentMap[c.post_id]?.push(c) })
    rawMembers?.forEach(m => {
      // Preserve the existing FeedCard member shape (`member.profile`) while
      // using the relationship result returned by Supabase (`users`).
      teamMap[m.project_id]?.push({ ...m, profile: m.users || null })
    })

    const enrichedPosts = posts.map(post => ({
      ...post,
      reactions: reactionMap[post.id] || [],
      comments: commentMap[post.id] || [],
      team_members: teamMap[post.id] || [],
    }))

    return NextResponse.json({ data: enrichedPosts }, { status: 200 })
 
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}