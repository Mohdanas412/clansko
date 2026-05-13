import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  const cookieStore = await cookies()  // ← add await
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
  const { connection_id } = body;

  if (!connection_id) {
    return NextResponse.json({ error: 'connection_id required' }, { status: 400 });
  }

  // Mark all unread messages in this connection as read (only those sent TO this user)
  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('connection_id', connection_id)
    .eq('is_read', false)
    .neq('sender_id', user.id); // Don't mark own messages

  if (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}