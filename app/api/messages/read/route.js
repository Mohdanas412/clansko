import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function PATCH(request) {
  const supabase = await getSupabaseServerClient();

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
    .eq('receiver_id', user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Mark as read error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}
