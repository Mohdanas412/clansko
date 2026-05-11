import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
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

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const { data: project, error: projectError } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()

    if (projectError) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    const { data: author } = await supabase
      .from('users')
      .select('id, name, college, branch, year, profile_photo, skills')
      .eq('id', project.user_id)
      .maybeSingle()

    const { data: members, error: membersError } = await supabase
      .from('project_members')
      .select('id, user_id, invited_by, role, status, created_at')
      .eq('project_id', id)

    if (membersError) {
      return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }

    let memberProfiles = []
    if (members && members.length > 0) {
      const memberUserIds = members.map(m => m.user_id)
      const { data: profiles } = await supabase
        .from('users')
        .select('id, name, college, branch, year, profile_photo, skills')
        .in('id', memberUserIds)

      memberProfiles = members.map(m => ({
        ...m,
        profile: (profiles || []).find(p => p.id === m.user_id) || null,
      }))
    }

    return NextResponse.json({
      data: {
        project,
        author,
        members: memberProfiles,
        isOwner: project.user_id === user.id,
        currentUserId: user.id,
      }
    }, { status: 200 })

  } catch (err) {
    console.error('GET /api/projects/[id] error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}