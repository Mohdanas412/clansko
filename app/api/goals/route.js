import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// GET - Fetch user's goals for current week
export async function GET(request) {
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

  const { searchParams } = new URL(request.url);
  const weekKey = searchParams.get('week_key');

  if (!weekKey) {
    return NextResponse.json({ error: 'week_key required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_key', weekKey)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

// POST - Create new goal
export async function POST(request) {
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
  const { goal_text, week_key } = body;

  if (!goal_text || !week_key) {
    return NextResponse.json({ error: 'goal_text and week_key required' }, { status: 400 });
  }

  // Check if user already has 3 goals this week
  const { data: existingGoals } = await supabase
    .from('goals')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_key', week_key);

  if (existingGoals && existingGoals.length >= 3) {
    return NextResponse.json({ error: 'Maximum 3 goals per week' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('goals')
    .insert({
      user_id: user.id,
      goal_text,
      week_key,
      status: 'pending',
      streak_count: 0
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// DELETE - Delete a goal
export async function DELETE(request) {
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

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get('goal_id');

  if (!goalId) {
    return NextResponse.json({ error: 'goal_id required' }, { status: 400 });
  }

  // Verify ownership
  const { data: goal } = await supabase
    .from('goals')
    .select('user_id')
    .eq('id', goalId)
    .single();

  if (!goal || goal.user_id !== user.id) {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
  }

  const { error } = await supabase
    .from('goals')
    .delete()
    .eq('id', goalId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Goal deleted' }, { status: 200 });
}