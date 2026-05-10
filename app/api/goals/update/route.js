import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { goal_id, status } = body;

  if (!goal_id || !status) {
    return NextResponse.json({ error: 'goal_id and status required' }, { status: 400 });
  }

  // Get current goal
  const { data: currentGoal, error: fetchError } = await supabase
    .from('goals')
    .select('*')
    .eq('id', goal_id)
    .single();

  if (fetchError || !currentGoal) {
    return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  }

  // Verify ownership
  if (currentGoal.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  // Calculate new streak count
  let newStreakCount = currentGoal.streak_count;
  if (status === 'done' && currentGoal.status === 'pending') {
    newStreakCount = currentGoal.streak_count + 1;
  } else if (status === 'pending' && currentGoal.status === 'done') {
    newStreakCount = Math.max(0, currentGoal.streak_count - 1);
  }

  // Update goal
  const { data, error } = await supabase
    .from('goals')
    .update({
      status,
      streak_count: newStreakCount,
      updated_at: new Date().toISOString()
    })
    .eq('id', goal_id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}