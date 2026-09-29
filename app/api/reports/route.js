// app/api/reports/route.js
export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '@/lib/supabase-server'
import { applyRateLimit } from '@/lib/ratelimit'

const VALID_TARGET_TYPES = ['post', 'comment', 'user']

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    // Rate limit: 10 reports per hour per user
    const rl = await applyRateLimit(request, 'report-create', user.id)
    if (!rl.success) return rl.response

    const body = await request.json()
    const { targetType, targetId, reason } = body || {}

    if (!targetType || !VALID_TARGET_TYPES.includes(targetType)) {
      return NextResponse.json(
        { error: 'Invalid targetType. Must be post, comment, or user.' },
        { status: 400 }
      )
    }

    if (!targetId || typeof targetId !== 'string') {
      return NextResponse.json({ error: 'targetId is required.' }, { status: 400 })
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return NextResponse.json({ error: 'reason is required.' }, { status: 400 })
    }

    if (reason.trim().length > 500) {
      return NextResponse.json({ error: 'reason must be 500 characters or fewer.' }, { status: 400 })
    }

    // Insert into reports table
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: targetType,
        target_id: targetId,
        reason: reason.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      // If the reports table has a unique index or custom RLS constraint
      console.error('Report submission error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data, message: 'Report submitted successfully.' }, { status: 201 })
  } catch (err) {
    console.error('POST /api/reports error:', err)
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 })
  }
}
