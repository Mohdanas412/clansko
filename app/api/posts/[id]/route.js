// app/api/posts/[id]/route.js
// GET a single post by ID
// Returns: post + author info + all comments (with commenter info) + reactions

export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams?.id

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required.' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

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

    // 2. Fetch a bounded, oldest-first comment page. The cursor includes both
    // sort fields so comments sharing a timestamp cannot be skipped.
    const { searchParams } = new URL(request.url)
    const requestedLimit = Number.parseInt(searchParams.get('comments_limit') || '30', 10)
    const commentsLimit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 50)
      : 30
    const commentsCursor = searchParams.get('comments_cursor')
    let cursorData = null

    if (commentsCursor) {
      try {
        cursorData = JSON.parse(Buffer.from(commentsCursor, 'base64url').toString('utf8'))
        if (!cursorData?.createdAt || !cursorData?.id || Number.isNaN(Date.parse(cursorData.createdAt))) {
          throw new Error('Invalid cursor')
        }
      } catch {
        return NextResponse.json({ error: 'Invalid comments cursor.' }, { status: 400 })
      }
    }

    let commentsQuery = supabase
      .from('comments')
      .select(`
        id, content, created_at, user_id,
        users:user_id ( id, name, profile_photo )
      `)
      .eq('post_id', id)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(commentsLimit + 1)

    if (cursorData) {
      commentsQuery = commentsQuery.or(
        `created_at.gt.${cursorData.createdAt},and(created_at.eq.${cursorData.createdAt},id.gt.${cursorData.id})`
      )
    }

    const { data: commentsWithExtra, error: commentsError } = await commentsQuery
    if (commentsError) console.error('Comments fetch error:', commentsError)
    const commentsHasMore = (commentsWithExtra?.length || 0) > commentsLimit
    const comments = commentsHasMore ? commentsWithExtra.slice(0, commentsLimit) : (commentsWithExtra || [])
    const lastComment = comments[comments.length - 1]
    const commentsNextCursor = commentsHasMore && lastComment
      ? Buffer.from(JSON.stringify({ createdAt: lastComment.created_at, id: lastComment.id })).toString('base64url')
      : null

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

    // 5. Atomic increment avoids lost updates under concurrent views.
    supabase.rpc('increment_post_view', { post_id: id }).then(({ error }) => {
      if (error) console.error('Post view increment error:', error)
    })

    // 6. Build final response object
    const result = {
      ...post,
      comments,
      commentsNextCursor,
      commentsHasMore,
      reactions: reactionCounts,
      reactions_by_user: reactionsByUser,
    }

    return NextResponse.json({ data: result }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}