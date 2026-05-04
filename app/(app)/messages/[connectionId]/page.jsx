// app/(app)/messages/[connectionId]/page.jsx
// Real-time chat page for one conversation
// Messages appear in bubbles — sent on right, received on left
// Supabase Realtime listens for new messages and adds them live

'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function ChatPage() {
  const router = useRouter()
  const params = useParams()
  const connectionId = params.connectionId  // from the URL: /messages/[connectionId]

  const [currentUser, setCurrentUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [otherUser, setOtherUser] = useState(null)
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  // This ref points to the bottom of the message list
  // We call scrollToBottom() every time messages update
  const bottomRef = useRef(null)
  // ADD THIS LINE — ref always has the latest currentUser value
// unlike state, refs don't go stale inside callbacks
const currentUserRef = useRef(null)

  // Create supabase client once — reused for both data fetching and Realtime
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // ─── Step 1: get logged-in user ───────────────────────────────────────────
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)
      currentUserRef.current = user   // ADD THIS LINE
    }
    getUser()
  }, [])

  // ─── Step 2: once we have the user, load chat history ────────────────────
  useEffect(() => {
    if (!currentUser || !connectionId) return
    loadMessages()
  }, [currentUser, connectionId])

  async function loadMessages() {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(`/api/messages?connectionId=${connectionId}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to load messages.')
        return
      }

      setMessages(json.data.messages || [])

      // Figure out who the "other" user is
      // The connection has senderId and receiverId — the other one is not us
      const otherId =
        json.data.senderId === currentUser.id
          ? json.data.receiverId
          : json.data.senderId

      // Fetch the other user's profile
      const userRes = await fetch(`/api/users/${otherId}`)
      const userJson = await userRes.json()
      if (userRes.ok) setOtherUser(userJson.data)

    } catch (err) {
      setError('Something went wrong loading messages.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 3: set up Supabase Realtime subscription ────────────────────────
  // This listens for any INSERT on the messages table for this connectionId
  // When a new message arrives (from the other user), it's added to state live
  useEffect(() => {
    if (!connectionId) return

    // Create a named channel — name must be unique per page instance
    const channel = supabase
      .channel(`chat-${connectionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',           // only care about new messages
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`,  // only this conversation
        },
        (payload) => {
          const newMsg = payload.new
  // Use the ref instead of state — ref is never stale in async callbacks
         if (currentUserRef.current && newMsg.sender_id !== currentUserRef.current.id) {
         setMessages(msgs => [...msgs, newMsg])
       }
   }
      )
      .subscribe()

    // Cleanup: unsubscribe when leaving the page
    // Without this, the channel keeps listening in the background
    return () => {
      supabase.removeChannel(channel)
    }
  }, [connectionId])

  // ─── Step 4: auto-scroll to bottom when messages change ──────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Step 5: send a message ───────────────────────────────────────────────
  async function sendMessage() {
    const trimmed = inputText.trim()
    if (!trimmed || sending || !currentUser) return

    // Optimistic update — add message to UI immediately before the API responds
    // This makes the app feel instant
    const tempMessage = {
      id: `temp-${Date.now()}`,       // temporary ID until the real one comes back
      content: trimmed,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      is_read: false,
      sender: { id: currentUser.id, name: 'You' },
      isOptimistic: true,             // flag so we can style it slightly differently if needed
    }

    setMessages(prev => [...prev, tempMessage])
    setInputText('')   // clear the input immediately
    setSending(true)

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId,
          senderId: currentUser.id,
          content: trimmed,
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        // If sending failed, remove the optimistic message and show error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
        setError(json.error || 'Failed to send message.')
        setInputText(trimmed)   // restore what they typed
        return
      }

      // Replace the temp message with the real one from the server
      // The real one has the correct ID, which matters for deduplication
      setMessages(prev =>
        prev.map(m => m.id === tempMessage.id ? json.data : m)
      )

    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id))
      setError('Failed to send. Please try again.')
      setInputText(trimmed)
    } finally {
      setSending(false)
    }
  }

  // Send on Enter key (Shift+Enter adds a newline — standard chat behaviour)
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function formatTime(isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
  }

  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Group consecutive messages from the same sender together
  // This avoids showing the avatar/name on every single bubble
  function shouldShowSenderInfo(index) {
    if (index === 0) return true
    return messages[index].sender_id !== messages[index - 1].sender_id
  }

  // ─── Loading state ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '15px', letterSpacing: '0.08em' }}>
          Loading chat...
        </p>
      </div>
    )
  }

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div style={{
      maxWidth: '720px',
      margin: '0 auto',
      height: 'calc(100vh - 56px)',  // 56px = navbar height
      display: 'flex',
      flexDirection: 'column',
    }}>

      {/* ── Chat header ── */}
      <div style={{
        padding: '16px 24px',
        borderBottom: '1px solid #2a2a4a',
        backgroundColor: '#16213e',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        flexShrink: 0,   // don't shrink — always visible at top
      }}>
        {/* Back button */}
        <button
          onClick={() => router.push('/messages')}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0 8px 0 0',
            lineHeight: 1,
          }}
        >
          ←
        </button>

        {/* Avatar */}
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#6c63ff33',
          border: '2px solid #6c63ff55',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {otherUser?.profile_photo ? (
            <img
              src={otherUser.profile_photo}
              alt={otherUser.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#a78bfa' }}>
              {getInitials(otherUser?.name)}
            </span>
          )}
        </div>

        {/* Name + college */}
        <div>
          <p style={{
            fontSize: '15px',
            fontWeight: 500,
            color: '#f8fafc',
            letterSpacing: '0.08em',
            margin: 0,
          }}>
            {otherUser?.name || 'Loading...'}
          </p>
          {otherUser?.college && (
            <p style={{
              fontSize: '12px',
              color: '#94a3b8',
              letterSpacing: '0.05em',
              margin: 0,
            }}>
              {otherUser.college}
            </p>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div style={{
          padding: '10px 24px',
          backgroundColor: '#1e1e2e',
          borderBottom: '1px solid #ef4444',
          color: '#ef4444',
          fontSize: '13px',
          flexShrink: 0,
        }}>
          {error}
          <button
            onClick={() => setError('')}
            style={{
              marginLeft: '12px',
              background: 'transparent',
              border: 'none',
              color: '#ef4444',
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Message list ── */}
      <div style={{
        flex: 1,            // takes up all remaining space between header and input
        overflowY: 'auto',  // scrollable
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}>

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <p style={{
              color: '#94a3b8',
              fontSize: '14px',
              letterSpacing: '0.08em',
              textAlign: 'center',
            }}>
              No messages yet. Say hello! 👋
            </p>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, index) => {
          const isMe = msg.sender_id === currentUser?.id
          const showInfo = shouldShowSenderInfo(index)

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: isMe ? 'flex-end' : 'flex-start',
                marginTop: showInfo ? '16px' : '2px',  // more space when sender changes
              }}
            >
              {/* Sender name — only shown when sender changes */}
              {showInfo && !isMe && (
                <span style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  letterSpacing: '0.05em',
                  marginBottom: '4px',
                  marginLeft: '4px',
                }}>
                  {otherUser?.name || 'Them'}
                </span>
              )}

              {/* The bubble itself */}
              <div style={{
                maxWidth: '70%',          // bubbles don't stretch full width
                backgroundColor: isMe ? '#6c63ff' : '#16213e',
                border: isMe ? 'none' : '1px solid #2a2a4a',
                borderRadius: isMe
                  ? '18px 18px 4px 18px'   // my bubble: sharp bottom-right corner
                  : '18px 18px 18px 4px',  // their bubble: sharp bottom-left corner
                padding: '10px 14px',
                wordBreak: 'break-word',
              }}>
                <p style={{
                  margin: 0,
                  fontSize: '15px',
                  color: '#f8fafc',
                  lineHeight: '1.5',
                  letterSpacing: '0.02em',
                }}>
                  {msg.content}
                </p>
              </div>

              {/* Timestamp */}
              <span style={{
                fontSize: '11px',
                color: '#94a3b8',
                marginTop: '3px',
                marginLeft: isMe ? 0 : '4px',
                marginRight: isMe ? '4px' : 0,
              }}>
                {formatTime(msg.created_at)}
              </span>
            </div>
          )
        })}

        {/* Invisible div at the bottom — we scroll to this */}
        <div ref={bottomRef} />
      </div>

      {/* ── Message input ── */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #2a2a4a',
        backgroundColor: '#16213e',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
        flexShrink: 0,   // always visible at bottom
      }}>
        <textarea
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send)"
          rows={1}
          style={{
            flex: 1,
            backgroundColor: '#0f0f1a',
            border: '1px solid #2a2a4a',
            borderRadius: '12px',
            padding: '12px 16px',
            color: '#f8fafc',
            fontSize: '15px',
            letterSpacing: '0.04em',
            resize: 'none',
            outline: 'none',
            fontFamily: 'Inter, sans-serif',
            lineHeight: '1.5',
            maxHeight: '120px',    // don't let it grow forever
            overflowY: 'auto',
          }}
          onInput={e => {
            // Auto-resize the textarea as the user types
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />

        <button
          onClick={sendMessage}
          disabled={!inputText.trim() || sending}
          style={{
            backgroundColor: inputText.trim() && !sending ? '#6c63ff' : '#2a2a4a',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            color: inputText.trim() && !sending ? '#fff' : '#94a3b8',
            fontSize: '15px',
            cursor: inputText.trim() && !sending ? 'pointer' : 'not-allowed',
            fontWeight: 500,
            letterSpacing: '0.08em',
            transition: 'background-color 0.15s',
            flexShrink: 0,
            height: '46px',
          }}
        >
          {sending ? '...' : 'Send'}
        </button>
      </div>
    </div>
  )
}