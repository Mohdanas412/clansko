import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function GET(request) {
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

    // My posted ideas
    const { data: myPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // All project_member rows for this user
    const { data: memberRows } = await supabase
      .from('project_members')
      .select('id, project_id, role, status, created_at')
      .eq('user_id', user.id)

    const pendingRows = (memberRows || []).filter(r => r.status === 'pending')
    const joinedRows = (memberRows || []).filter(r => r.status === 'accepted')

    // Fetch the post details for pending + joined
    const allProjectIds = [...pendingRows, ...joinedRows].map(r => r.project_id)

    let projectDetails = []
    if (allProjectIds.length > 0) {
      const { data: posts } = await supabase
        .from('posts')
        .select('id, title, description, stage, user_id')
        .in('id', allProjectIds)

      // Fetch authors
      const authorIds = [...new Set((posts || []).map(p => p.user_id))]
      const { data: authors } = await supabase
        .from('users')
        .select('id, name, college, profile_photo')
        .in('id', authorIds)

      projectDetails = (posts || []).map(p => ({
        ...p,
        author: (authors || []).find(a => a.id === p.user_id) || null,
      }))
    }

    const pendingInvites = pendingRows.map(r => ({
      inviteId: r.id,
      role: r.role,
      createdAt: r.created_at,
      project: projectDetails.find(p => p.id === r.project_id) || null,
    }))

    const joinedProjects = joinedRows.map(r => ({
      membershipId: r.id,
      role: r.role,
      project: projectDetails.find(p => p.id === r.project_id) || null,
    }))

    return NextResponse.json({
      data: {
        myPosts: myPosts || [],
        pendingInvites,
        joinedProjects,
      }
    }, { status: 200 })

  } catch (err) {
    console.error('GET /api/projects/my error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}