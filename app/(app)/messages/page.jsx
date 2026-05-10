'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function MessagesPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          router.push('/login');
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user:', userError);
          setLoading(false);
          return;
        }

        setCurrentUser(userData);

        // Get accepted connections
        const { data: connections, error: connectionsError } = await supabase
          .from('connections')
          .select(`
  *,
  sender:sender_id(id, name, profile_photo),
  receiver:receiver_id(id, name, profile_photo)
`)
          .eq('status', 'accepted')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false });

        if (connectionsError) {
          console.error('Error fetching connections:', connectionsError);
          setLoading(false);
          return;
        }

        if (connections && connections.length > 0) {
          // Get last message for each connection
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

                // Get unread count
                const { data: unreadMessages } = await supabase
                  .from('messages')
                  .select('id')
                  .eq('connection_id', conn.id)
                  .eq('is_read', false)
                  .neq('sender_id', user.id);

                const otherUser = conn.sender_id === user.id ? conn.receiver : conn.sender;

                return {
                  connectionId: conn.id,
                  otherUser,
                  lastMessage,
                  unreadCount: unreadMessages?.length || 0,
                  timestamp: lastMessage?.created_at || conn.created_at
                };
              } catch (error) {
                console.error('Error processing connection:', error);
                return null;
              }
            })
          );

          // Filter out null results and sort by most recent message
          const validConversations = conversationsWithMessages.filter(c => c !== null);
          validConversations.sort((a, b) => 
            new Date(b.timestamp) - new Date(a.timestamp)
          );

          setConversations(validConversations);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error initializing messages page:', error);
        setLoading(false);
      }
    }

    init();
  }, [supabase, router]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#111111',
        paddingTop: '24px',
        paddingLeft: '24px',
        paddingRight: '24px',
        paddingBottom: '80px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            background: '#161616',
            border: '1px solid #1E1E1E',
            borderRadius: '12px',
            padding: '20px'
          }}>
            <div style={{ width: '150px', height: '24px', background: '#1E1E1E', borderRadius: '4px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      paddingTop: '0',
      paddingLeft: '0',
      paddingRight: '0',
      paddingBottom: '80px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{
            width: '28px',
            height: '3px',
            background: '#F97316',
            borderRadius: '2px',
            marginBottom: '16px'
          }}></div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '40px',
            fontWeight: '400',
            fontStyle: 'italic',
            color: '#F5F0E8',
            marginBottom: '8px'
          }}>
            Messages
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            color: '#9A9A8A'
          }}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Conversations List */}
        {conversations.length === 0 ? (
          <div style={{
            background: '#161616',
            border: '1px solid #1E1E1E',
            borderRadius: '12px',
            padding: '60px 24px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h3 style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '18px',
              fontWeight: '600',
              color: '#F5F0E8',
              marginBottom: '8px'
            }}>
              No messages yet
            </h3>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
              color: '#9A9A8A',
              marginBottom: '20px'
            }}>
              Connect with builders to start conversations
            </p>
            <button
              onClick={() => router.push('/explore')}
              style={{
                background: '#F97316',
                color: '#111111',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 20px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Explore Builders
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {conversations.map((conv) => (
              <button
                key={conv.connectionId}
                onClick={() => router.push(`/messages/${conv.connectionId}`)}
                style={{
                  background: '#161616',
                  border: '1px solid #1E1E1E',
                  borderRadius: '12px',
                  padding: '16px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 0.2s',
                  display: 'block',
                  width: '100%'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2A2A2A'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E1E1E'}
              >
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Avatar */}
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '10px',
                    background: '#F9731620',
                    border: '2px solid #F9731640',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: '600',
                    color: '#F97316',
                    flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {conv.otherUser?.profile_photo ? (
                      <img 
                        src={conv.otherUser.profile_photo} 
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerText = conv.otherUser?.name?.charAt(0).toUpperCase();
                        }}
                      />
                    ) : (
                      conv.otherUser?.name?.charAt(0).toUpperCase()
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '15px',
                        fontWeight: '600',
                        color: '#F5F0E8'
                      }}>
                        {conv.otherUser?.name || 'Unknown User'}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '12px',
                        color: '#6A6A5A'
                      }}>
                        {formatTime(conv.timestamp)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        color: '#9A9A8A',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1
                      }}>
                        {conv.lastMessage?.content || 'Start a conversation'}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div style={{
                          background: '#F97316',
                          color: '#111111',
                          borderRadius: '10px',
                          padding: '2px 8px',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: '11px',
                          fontWeight: '600',
                          minWidth: '20px',
                          textAlign: 'center'
                        }}>
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}