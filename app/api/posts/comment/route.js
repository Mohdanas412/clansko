// app/api/posts/comment/route.js
// POST → add a comment to a post
// Returns the new comment WITH commenter info (name + photo)
// so the frontend can immediately append it to the list without refetching

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
    const { userId, postId, content } = await request.json()

    // 1. Validate inputs
    if (!userId || !postId || !content) {
      return NextResponse.json(
        { error: 'userId, postId, and content are required.' },
        { status: 400 }
      )
    }

    // 2. Trim content and check it's not just whitespace
    const trimmedContent = content.trim()
    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: 'Comment cannot be empty.' },
        { status: 400 }
      )
    }

    // 3. Max length guard — keep comments reasonable
    if (trimmedContent.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be under 500 characters.' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // 4. Insert the comment
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: userId,
        content: trimmedContent,
        created_at: new Date().toISOString(),
      })
      .select('id, content, created_at, user_id')
      .single()

    if (insertError) {
      console.error('Comment insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // 5. Fetch the commenter's profile so the frontend can show
    //    name + photo immediately without a second request
    const { data: author, error: authorError } = await supabase
      .from('users')
      .select('id, name, profile_photo')
      .eq('id', userId)
      .single()

    if (authorError) {
      // Comment was saved — don't fail the request
      // Just return without author info
      console.error('Author fetch error:', authorError)
      return NextResponse.json({
        data: { ...newComment, users: null }
      }, { status: 200 })
    }

    // 6. Return comment + author info merged together
    //    Same shape as what api/posts/[id]/route.js returns for comments
    //    so the frontend can append it directly to the comments array
    return NextResponse.json({
      data: {
        ...newComment,
        users: author,
      }
    }, { status: 200 })

  } catch (err) {
    console.error('Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}