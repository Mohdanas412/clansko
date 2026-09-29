import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Execute posts query and joined project_memberships query in parallel
    const [myPostsResult, memberRowsResult] = await Promise.all([
      supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('project_members')
        .select(`
          id, project_id, role, status, created_at,
          project:project_id (
            id, title, description, stage, user_id,
            author:user_id ( id, name, college, profile_photo )
          )
        `)
        .eq('user_id', user.id)
    ])

    if (myPostsResult.error) {
      return NextResponse.json({ error: myPostsResult.error.message }, { status: 500 })
    }
    if (memberRowsResult.error) {
      return NextResponse.json({ error: memberRowsResult.error.message }, { status: 500 })
    }

    const memberRows = memberRowsResult.data || []
    const pendingRows = memberRows.filter(r => r.status === 'pending')
    const joinedRows = memberRows.filter(r => r.status === 'accepted')

    const pendingInvites = pendingRows.map(r => ({
      inviteId: r.id,
      role: r.role,
      createdAt: r.created_at,
      project: r.project || null,
    }))

    const joinedProjects = joinedRows.map(r => ({
      membershipId: r.id,
      role: r.role,
      project: r.project || null,
    }))

    return NextResponse.json({
      data: {
        myPosts: myPostsResult.data || [],
        pendingInvites,
        joinedProjects,
      }
    }, { status: 200 })

  } catch (err) {
    console.error('GET /api/projects/my error:', err.message)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
