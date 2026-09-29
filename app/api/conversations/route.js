// app/api/conversations/route.js
// GET /api/conversations?limit=30&cursor=<opaque cursor>
// Returns a bounded, newest-activity-first page without per-connection queries.
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function getSupabase() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { get(name) { return cookieStore.get(name)?.value } } }
  )
}

function decodeCursor(cursor) {
  if (!cursor) return null

  try {
    const value = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
    if (!value?.timestamp || !value?.connectionId || Number.isNaN(Date.parse(value.timestamp))) {
      throw new Error('Invalid cursor')
    }
    return value
  } catch {
    return undefined
  }
}

export async function GET(request) {
  try {
    const supabase = getSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '30', 10)
    const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 30
    const cursor = decodeCursor(searchParams.get('cursor'))
    if (cursor === undefined) {
      return NextResponse.json({ error: 'Invalid cursor.' }, { status: 400 })
    }

    // get_conversations_page performs the last-message lookup and unread aggregate
    // in one database query. It is defined in the 1,000-users Supabase migration.
    const { data, error } = await supabase.rpc('get_conversations_page', {
      page_limit: limit + 1,
      page_cursor_timestamp: cursor?.timestamp || null,
      page_cursor_connection_id: cursor?.connectionId || null,
    })

    if (error) {
      console.error('Conversations fetch error:', error)
      return NextResponse.json({ error: 'Unable to load conversations.' }, { status: 500 })
    }

    const rows = data || []
    const hasMore = rows.length > limit
    const conversations = hasMore ? rows.slice(0, limit) : rows
    const lastConversation = conversations[conversations.length - 1]
    const nextCursor = hasMore && lastConversation
      ? Buffer.from(JSON.stringify({
          timestamp: lastConversation.timestamp,
          connectionId: lastConversation.connectionId,
        })).toString('base64url')
      : null

    return NextResponse.json({ data: conversations, nextCursor, hasMore }, { status: 200 })
  } catch (error) {
    console.error('Unexpected conversations error:', error)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}