import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams?.id

    if (!id) {
      return NextResponse.json({ error: 'Project ID is required.' }, { status: 400 })
    }

    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch project with author join and team members with profile join in parallel
    const [projectResult, membersResult] = await Promise.all([
      supabase
        .from('posts')
        .select(`
          *,
          author:user_id ( id, name, college, branch, year, profile_photo, skills )
        `)
        .eq('id', id)
        .single(),
      supabase
        .from('project_members')
        .select(`
          id, user_id, invited_by, role, status, created_at,
          profile:user_id ( id, name, college, branch, year, profile_photo, skills )
        `)
        .eq('project_id', id)
    ])

    if (projectResult.error || !projectResult.data) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (membersResult.error) {
      return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 })
    }

    const projectData = projectResult.data
    const author = projectData.author
    // Disassociate author from the base project object if frontend expects them separated
    const { author: _, ...project } = projectData

    return NextResponse.json({
      data: {
        project,
        author: author || null,
        members: membersResult.data || [],
        isOwner: project.user_id === user.id,
        currentUserId: user.id,
      }
    }, { status: 200 })

  } catch (err) {
    console.error('GET /api/projects/[id] error:', err.message)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
