// app/api/posts/create/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { applyRateLimit } from '@/lib/ratelimit'
import { validatePost } from '@/lib/validation'

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient()

    // Auth check — userId always comes from the verified session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }


    // Rate limit: 5 posts per hour per user
    const rl = await applyRateLimit(request, 'post-create', user.id)
    if (!rl.success) return rl.response

    const body = await request.json()

    // Validate all fields
    const validation = validatePost(body)
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status })
    }

    const { title, description, stage, looking_for } = validation.value

    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        title,
        description,
        stage,
        looking_for,
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