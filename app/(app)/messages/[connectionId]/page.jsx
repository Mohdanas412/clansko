'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function ChatPage() {
  const params = useParams()
  const router = useRouter()
  const connectionId = params.connectionId

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const [currentUser, setCurrentUser] = useState(null)
  const [otherUser, setOtherUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)
  const currentUserRef = useRef(null)

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // ─── Main init + realtime setup ───────────────────────────────────────────
  useEffect(() => {
    let channel = null

    async function init() {
      // 1. Get logged in user from Supabase auth
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // 2. Get current user's profile from our API
      const userRes = await fetch(`/api/users/${user.id}`)
      const userJson = await userRes.json()
      if (!userRes.ok) {
        router.push('/messages')
        return
      }
      setCurrentUser(userJson.data)
      currentUserRef.current = userJson.data  // ref stays fresh in callbacks

      // 3. Fetch messages + connection info from our API
      //    This avoids the broken direct Supabase foreign key query
      const msgRes = await fetch(`/api/messages?connectionId=${connectionId}`)
      const msgJson = await msgRes.json()

      if (!msgRes.ok) {
        router.push('/messages')
        return
      }

      setMessages(msgJson.data.messages || [])

      // 4. Figure out who the other user is from the connection
      const otherId =
        msgJson.data.senderId === user.id
          ? msgJson.data.receiverId
          : msgJson.data.senderId

      const otherRes = await fetch(`/api/users/${otherId}`)
      const otherJson = await otherRes.json()
      if (otherRes.ok) setOtherUser(otherJson.data)

      setLoading(false)
      setTimeout(scrollToBottom, 100)

      // 5. Set up Realtime subscription
      //    .on() must come BEFORE .subscribe()
      channel = supabase.channel(`messages:${connectionId}`)

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
            const newMsg = payload.new
            // Only add if from the other person — our own messages
            // are already added optimistically in handleSend
            if (
              currentUserRef.current &&
              newMsg.sender_id !== currentUserRef.current.id
            ) {
              setMessages(prev => [...prev, newMsg])
              setTimeout(scrollToBottom, 100)
            }
          }
        )
        .subscribe()
    }

    init()

    // Cleanup — this must be at useEffect level, NOT inside init()
    // Otherwise the channel never gets removed when you leave the page
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [connectionId])

  // ─── Send message ─────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || sending) return

    setSending(true)
    const messageText = newMessage
    setNewMessage('')  // clear input immediately

    // Optimistic update — show message instantly before API responds
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: messageText,
      sender_id: currentUserRef.current?.id,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, tempMsg])
    setTimeout(scrollToBottom, 100)

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: connectionId,          // must be connectionId not connection_id
          senderId: currentUserRef.current?.id, // must include senderId
          content: messageText,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        // Remove optimistic message and restore input on failure
        setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
        setNewMessage(messageText)
      } else {
        // Replace temp message with the real one from the server
        setMessages(prev =>
          prev.map(m => m.id === tempMsg.id ? json.data : m)
        )
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMsg.id))
      setNewMessage(messageText)
    }

    setSending(false)
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function formatTime(timestamp) {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  // Group messages by date for date dividers
  const groupedMessages = messages.reduce((groups, message) => {
    const date = new Date(message.created_at).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(message)
    return groups
  }, {})

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        background: '#111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '15px',
          color: '#9A9A8A'
        }}>
          Loading chat...
        </p>
      </div>
    )
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{
      height: '100vh',
      background: '#111111',
      display: 'flex',
      flexDirection: 'column'
    }}>

      {/* ── Chat header ── */}
      <div style={{
        background: '#161616',
        borderBottom: '1px solid #1E1E1E',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        {/* Back button */}
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

        {/* Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '8px',
          background: '#F9731620',
          border: '2px solid #F9731640',
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
              onError={e => { e.target.style.display = 'none' }}
            />
          ) : (
            otherUser?.name?.charAt(0).toUpperCase()
          )}
        </div>

        {/* Name + college */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '16px',
            fontWeight: '600',
            color: '#F5F0E8'
          }}>
            {otherUser?.name || 'Loading...'}
          </div>
          {otherUser?.college && (
            <div style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: '#6A6A5A'
            }}>
              {otherUser.college}
            </div>
          )}
        </div>

        {/* View profile button */}
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

      {/* ── Messages area ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '200px'
            }}>
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#6A6A5A'
              }}>
                No messages yet — say hello! 👋
              </p>
            </div>
          )}

          {/* Messages grouped by date */}
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>

              {/* Date divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '24px 0 16px'
              }}>
                <div style={{ flex: 1, height: '1px', background: '#1E1E1E' }} />
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
                <div style={{ flex: 1, height: '1px', background: '#1E1E1E' }} />
              </div>

              {/* Message bubbles */}
              {msgs.map((message, index) => {
                const isOwn = message.sender_id === currentUserRef.current?.id
                const showAvatar =
                  index === 0 || msgs[index - 1].sender_id !== message.sender_id

                return (
                  <div
                    key={message.id}
                    style={{
                      display: 'flex',
                      justifyContent: isOwn ? 'flex-end' : 'flex-start',
                      marginBottom: '12px',
                      gap: '8px',
                      alignItems: 'flex-end'
                    }}
                  >
                    {/* Other person's avatar */}
                    {!isOwn && (
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: '#F9731620',
                        border: showAvatar ? '2px solid #F9731640' : '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '13px',
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
                              onError={e => { e.target.style.display = 'none' }}
                            />
                          ) : (
                            otherUser?.name?.charAt(0).toUpperCase()
                          )
                        )}
                      </div>
                    )}

                    {/* Bubble + timestamp */}
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
                        wordBreak: 'break-word',
                        border: isOwn ? 'none' : '1px solid #2A2A2A'
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
                )
              })}
            </div>
          ))}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ── Message input ── */}
      <div style={{
        background: '#161616',
        borderTop: '1px solid #1E1E1E',
        padding: '16px 24px',
        position: 'sticky',
        bottom: 0
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <form
            onSubmit={handleSend}
            style={{ display: 'flex', gap: '12px' }}
          >
            <input
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                background: '#111111',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                padding: '12px 16px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                color: '#F5F0E8',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              style={{
                background: sending || !newMessage.trim() ? '#2A2A2A' : '#F97316',
                color: sending || !newMessage.trim() ? '#6A6A5A' : '#111111',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '14px',
                fontWeight: '600',
                cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
                flexShrink: 0
              }}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>

    </div>
  )
}