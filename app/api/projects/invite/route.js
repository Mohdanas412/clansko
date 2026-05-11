import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

const cookieStore = await cookies()
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    cookies: {
      get(name) { return cookieStore.get(name)?.value },
      set() {},
      remove() {},
    },
  }
)
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value },
        set() {},
        remove() {},
      },
    }
  )
}

export async function POST(request) {
  try {
    const supabase = createServerSupabaseClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { project_id, user_id, role } = await request.json()

    if (!project_id || !user_id) {
      return NextResponse.json({ error: 'project_id and user_id are required' }, { status: 400 })
    }

    // Verify the requester owns this project
    const { data: project, error: projectError } = await supabase
      .from('posts')
      .select('id, user_id, title')
      .eq('id', project_id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (project.user_id !== user.id) {
      return NextResponse.json({ error: 'Only the project owner can invite members' }, { status: 403 })
    }

    // Cannot invite yourself
    if (user_id === user.id) {
      return NextResponse.json({ error: 'You cannot invite yourself' }, { status: 400 })
    }

    // Check they are actually connected (either direction)
    const { data: connection } = await supabase
      .from('connections')
      .select('id, status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${user_id}),and(sender_id.eq.${user_id},receiver_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle()

    if (!connection) {
      return NextResponse.json({ error: 'You can only invite your connections' }, { status: 403 })
    }

    // Check not already a member or invited
    const { data: existing } = await supabase
      .from('project_members')
      .select('id, status')
      .eq('project_id', project_id)
      .eq('user_id', user_id)
      .maybeSingle()

    if (existing) {
      const msg = existing.status === 'accepted'
        ? 'This person is already on the team'
        : 'This person already has a pending invite'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Create the invite
    const { data: invite, error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id,
        user_id,
        invited_by: user.id,
        role: role || 'member',
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    return NextResponse.json({ data: invite }, { status: 200 })

  } catch (err) {
    console.error('POST /api/projects/invite error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}