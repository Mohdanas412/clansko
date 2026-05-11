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

    const { invite_id, action } = await request.json()

    if (!invite_id || !action) {
      return NextResponse.json({ error: 'invite_id and action are required' }, { status: 400 })
    }

    if (!['accepted', 'declined'].includes(action)) {
      return NextResponse.json({ error: 'action must be accepted or declined' }, { status: 400 })
    }

    // Fetch the invite row
    const { data: invite, error: fetchError } = await supabase
      .from('project_members')
      .select('id, user_id, project_id, status')
      .eq('id', invite_id)
      .maybeSingle()

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
    }

    // Only the invited person can respond
    if (invite.user_id !== user.id) {
      return NextResponse.json({ error: 'This invite is not for you' }, { status: 403 })
    }

    // Can only respond to pending invites
    if (invite.status !== 'pending') {
      return NextResponse.json({ error: `Invite already ${invite.status}` }, { status: 400 })
    }

    // Update status
    const { data: updated, error: updateError } = await supabase
      .from('project_members')
      .update({
        status: action,
        updated_at: new Date().toISOString(),
      })
      .eq('id', invite_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update invite' }, { status: 500 })
    }

    return NextResponse.json({ data: updated }, { status: 200 })

  } catch (err) {
    console.error('POST /api/projects/respond error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}