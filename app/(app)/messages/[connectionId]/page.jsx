'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const connectionId = params.connectionId;

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [currentUser, setCurrentUser] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const currentUserRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
  async function init() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    setCurrentUser(userData);
    currentUserRef.current = userData;

    // Get connection details
    const { data: connection } = await supabase
      .from('connections')
      .select(`
        *,
        sender:users!connections_sender_id_fkey(*),
        receiver:users!users!connections_receiver_id_fkey(*)
      `)
      .eq('id', connectionId)
      .single();

    if (!connection) {
      toast.error('Connection not found');
      router.push('/messages');
      return;
    }

    const other = connection.sender_id === user.id ? connection.receiver : connection.sender;
    setOtherUser(other);

    // Get messages
    const { data: messagesData } = await supabase
      .from('messages')
      .select('*')
      .eq('connection_id', connectionId)
      .order('created_at', { ascending: true });

    setMessages(messagesData || []);

    // Mark messages as read
    await fetch('/api/messages/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_id: connectionId })
    });

    setLoading(false);
    setTimeout(scrollToBottom, 100);

    // Subscribe to new messages - FIXED ORDER
    const channel = supabase.channel(`messages:${connectionId}`);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        },
        (payload) => {
          const newMsg = payload.new;
          setMessages((prev) => [...prev, newMsg]);

          // Mark as read if from other user
          if (currentUserRef.current && newMsg.sender_id !== currentUserRef.current.id) {
            fetch('/api/messages/read', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ connection_id: connectionId })
            });
          }

          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe(); // Subscribe AFTER .on()

    return () => {
      supabase.removeChannel(channel);
    };
  }

  init();
}, [connectionId, supabase, router]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const messageText = newMessage;
    setNewMessage('');

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connection_id: connectionId,
          content: messageText
        })
      });

      if (!response.ok) {
        setNewMessage(messageText);
        toast.error('Failed to send message');
      }
    } catch (error) {
      setNewMessage(messageText);
      toast.error('Something went wrong');
    }

    setSending(false);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: '#9A9A8A'
        }}>
          Loading chat...
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      background: '#111111',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Chat Header */}
      <div style={{
        background: '#161616',
        border: '1px solid #1E1E1E',
        borderTop: 'none',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <button
          onClick={() => router.push('/messages')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#F97316',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          ←
        </button>

        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: otherUser?.profile_photo ? 'transparent' : '#F9731620',
          border: `2px solid ${otherUser?.profile_photo ? '#2A2A2A' : '#F9731640'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '16px',
          fontWeight: '600',
          color: '#F97316',
          overflow: 'hidden',
          flexShrink: 0
        }}>
          {otherUser?.profile_photo ? (
            <img 
              src={otherUser.profile_photo} 
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            otherUser?.name?.charAt(0).toUpperCase()
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px',
            fontWeight: '600',
            color: '#F5F0E8'
          }}>
            {otherUser?.name}
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            color: '#6A6A5A'
          }}>
            {otherUser?.college}
          </div>
        </div>

        <button
          onClick={() => router.push(`/profile/${otherUser?.id}`)}
          style={{
            background: 'transparent',
            color: '#F97316',
            border: '1px solid #2A2A2A',
            borderRadius: '6px',
            padding: '8px 16px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '13px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          View Profile
        </button>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
        paddingBottom: '100px'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '24px 0 16px'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#1E1E1E' }}></div>
                <div style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '12px',
                  color: '#6A6A5A',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {formatDate(msgs[0].created_at)}
                </div>
                <div style={{ flex: 1, height: '1px', background: '#1E1E1E' }}></div>
              </div>

              {/* Messages */}
              {msgs.map((message, index) => {
                const isOwn = message.sender_id === currentUser?.id;
                const showAvatar = index === 0 || msgs[index - 1].sender_id !== message.sender_id;

                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      marginBottom: '12px',
                      gap: '8px'
                    }}
                  >
                    {!isOwn && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: showAvatar && otherUser?.profile_photo ? 'transparent' : 'transparent',
                        border: showAvatar ? `2px solid ${otherUser?.profile_photo ? '#2A2A2A' : '#F9731640'}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#F97316',
                        flexShrink: 0,
                        overflow: 'hidden',
                        visibility: showAvatar ? 'visible' : 'hidden'
                      }}>
                        {showAvatar && (
                          otherUser?.profile_photo ? (
                            <img 
                              src={otherUser.profile_photo} 
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            otherUser?.name?.charAt(0).toUpperCase()
                          )
                        )}
                      </div>
                    )}

                    <div style={{
                      maxWidth: '70%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isOwn ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        background: isOwn ? '#F97316' : '#161616',
                        color: isOwn ? '#111111' : '#F5F0E8',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '14px',
                        lineHeight: '1.5',
                        wordBreak: 'break-word'
                      }}>
                        {message.content}
                      </div>
                      <div style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: '11px',
                        color: '#6A6A5A',
                        marginTop: '4px',
                        paddingLeft: '4px',
                        paddingRight: '4px'
                      }}>
                        {formatTime(message.created_at)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div style={{
        background: '#161616',
        border: '1px solid #1E1E1E',
        borderBottom: 'none',
        padding: '16px 24px',
        position: 'sticky',
        bottom: 0
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: '#111111',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                padding: '12px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#F5F0E8'
              }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              style={{
                background: '#F97316',
                color: '#111111',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !newMessage.trim() ? 0.5 : 1
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}