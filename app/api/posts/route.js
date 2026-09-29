// app/api/posts/route.js
// GET a bounded page of posts (optionally filtered by user_id), joined with author info.
// Ordered by newest first.
 
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
 
export async function GET(request) {
  try {
    const supabase = await getSupabaseServerClient()
 
    // ✅ FIX: Auth check was missing entirely.
    // Previously anyone could call this endpoint and read all posts + author data.
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

 
    // Optional `user_id` supports profile pages. Feed pagination uses an opaque
    // cursor carrying both sort fields so records with identical timestamps are
    // never skipped or duplicated between pages.
    const { searchParams } = new URL(request.url)
    const filterUserId = searchParams.get('user_id')
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 20
    const cursor = searchParams.get('cursor')
    let cursorData = null

    if (cursor) {
      try {
        cursorData = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
        if (!cursorData?.createdAt || !cursorData?.id || Number.isNaN(Date.parse(cursorData.createdAt))) {
          throw new Error('Invalid cursor')
        }
      } catch {
        return NextResponse.json({ error: 'Invalid cursor.' }, { status: 400 })
      }
    }
 
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
      .order('id', { ascending: false })
      .limit(limit + 1)
 
    if (filterUserId) query = query.eq('user_id', filterUserId)
    if (cursorData) {
      query = query.or(
        `created_at.lt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.lt.${cursorData.id})`
      )
    }
 
    const { data: postsWithExtra, error } = await query
    const hasMore = (postsWithExtra?.length || 0) > limit
    const posts = hasMore ? postsWithExtra.slice(0, limit) : (postsWithExtra || [])
 
    if (error) {
      console.error('Posts fetch error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
 
    if (posts.length === 0) {
      return NextResponse.json({ data: [], nextCursor: null, hasMore: false }, { status: 200 })
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

    const lastPost = posts[posts.length - 1]
    const nextCursor = hasMore
      ? Buffer.from(JSON.stringify({ createdAt: lastPost.created_at, id: lastPost.id })).toString('base64url')
      : null

    return NextResponse.json({ data: enrichedPosts, nextCursor, hasMore }, { status: 200 })
 
  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}