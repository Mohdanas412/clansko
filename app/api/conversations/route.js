// app/api/conversations/route.js
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
 
export const dynamic = 'force-dynamic';
 
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
 
  // ✅ AUTH CHECK — server-side, cannot be spoofed
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
 
  // ✅ Only fetch connections belonging to the authenticated user
  const { data: connections, error: connError } = await supabase
    .from('connections')
    .select(`
      id,
      sender_id,
      receiver_id,
      created_at,
      sender:users!connections_sender_id_fkey(id, name, profile_photo),
      receiver:users!connections_receiver_id_fkey(id, name, profile_photo)
    `)
    .eq('status', 'accepted')
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false });
 
  if (connError) {
    return NextResponse.json({ error: connError.message }, { status: 500 });
  }
 
  if (!connections || connections.length === 0) {
    return NextResponse.json({ data: [] }, { status: 200 });
  }
 
  // ✅ For each connection, fetch last message + unread count
  // All of this runs server-side — user.id is from verified auth token
  const conversationsWithMessages = await Promise.all(
    connections.map(async (conn) => {
      try {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('connection_id', conn.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
 
        const { data: unreadMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('connection_id', conn.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);
 
        const otherUser =
          conn.sender_id === user.id ? conn.receiver : conn.sender;
 
        return {
          connectionId: conn.id,
          otherUser,
          lastMessage,
          unreadCount: unreadMessages?.length || 0,
          timestamp: lastMessage?.created_at || conn.created_at,
        };
      } catch (err) {
        console.error('Error processing connection:', err);
        return null;
      }
    })
  );
 
  const validConversations = conversationsWithMessages
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
 
  return NextResponse.json({ data: validConversations }, { status: 200 });
}