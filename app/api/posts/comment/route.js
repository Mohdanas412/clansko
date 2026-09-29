// app/api/posts/comment/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { validateComment } from '@/lib/validation'

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient()

    // Auth check — userId always comes from the verified session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }


    const body = await request.json()

    // Validate postId and content (1–500 chars)
    const validation = validateComment(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const { postId, content } = validation.value

    // Insert comment using user.id from auth session
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        created_at: new Date().toISOString(),
      })
      .select('id, content, created_at, user_id')
      .single()

    if (insertError) {
      console.error('Comment insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Fetch commenter profile for immediate UI append
    const { data: author, error: authorError } = await supabase
      .from('users')
      .select('id, name, profile_photo')
      .eq('id', user.id)
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