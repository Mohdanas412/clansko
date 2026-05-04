// app/(app)/messages/page.jsx
// Inbox page — shows all accepted connections as a list
// Click any connection to open the full chat

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function MessagesPage() {
  const router = useRouter()

  // currentUser = the logged-in user's full profile from Supabase auth
  const [currentUser, setCurrentUser] = useState(null)

  // conversations = accepted connections with the other person's info
  const [conversations, setConversations] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Always use createBrowserClient in client components — never lib/supabase.js
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // ─── Step 1: get the logged-in user ───────────────────────────────────────
  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setCurrentUser(user)
    }
    getUser()
  }, [])

  // ─── Step 2: once we have the user, load their connections ────────────────
  useEffect(() => {
    if (!currentUser) return
    loadConversations()
  }, [currentUser])

  async function loadConversations() {
    try {
      setLoading(true)
      setError('')

      // Fetch all connections for this user (sent + received)
      const res = await fetch(`/api/connections?userId=${currentUser.id}`)
      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to load conversations.')
        return
      }

      // Filter to only accepted connections — those are the ones we can chat in
      const accepted = (json.data || []).filter(c => c.status === 'accepted')

      // For each accepted connection, fetch the last message so we can show a preview
      // We do this with Promise.all so all fetches happen in parallel, not one by one
      const withPreviews = await Promise.all(
        accepted.map(async (conn) => {
          try {
            const msgRes = await fetch(`/api/messages?connectionId=${conn.connectionId}`)
            const msgJson = await msgRes.json()

            if (!msgRes.ok) return { ...conn, lastMessage: null, unreadCount: 0 }

            const messages = msgJson.data?.messages || []
            const lastMessage = messages[messages.length - 1] || null

            // Count unread messages — ones not sent by me and not yet read
            const unreadCount = messages.filter(
              m => m.sender_id !== currentUser.id && !m.is_read
            ).length

            return { ...conn, lastMessage, unreadCount }
          } catch {
            return { ...conn, lastMessage: null, unreadCount: 0 }
          }
        })
      )

      // Sort: conversations with most recent message first
      withPreviews.sort((a, b) => {
        const aTime = a.lastMessage?.created_at || a.createdAt
        const bTime = b.lastMessage?.created_at || b.createdAt
        return new Date(bTime) - new Date(aTime)
      })

      setConversations(withPreviews)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // Format timestamp to a readable short string
  function formatTime(isoString) {
    if (!isoString) return ''
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  // Get initials for avatar placeholder when there's no profile photo
  function getInitials(name) {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: '#94a3b8', fontSize: '15px', letterSpacing: '0.08em' }}>
          Loading conversations...
        </p>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: '680px',
      margin: '0 auto',
      padding: '32px 16px',
    }}>

      {/* ── Header ── */}
      <h1 style={{
        fontSize: '22px',
        fontWeight: 500,
        color: '#f8fafc',
        letterSpacing: '0.08em',
        marginBottom: '8px',
      }}>
        Messages
      </h1>
      <p style={{
        fontSize: '14px',
        color: '#94a3b8',
        letterSpacing: '0.08em',
        marginBottom: '32px',
      }}>
        Your accepted connections
      </p>

      {/* ── Error state ── */}
      {error && (
        <div style={{
          backgroundColor: '#1e1e2e',
          border: '1px solid #ef4444',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          color: '#ef4444',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      {/* ── Empty state ── */}
      {!error && conversations.length === 0 && (
        <div style={{
          backgroundColor: '#16213e',
          border: '1px solid #2a2a4a',
          borderRadius: '12px',
          padding: '48px 24px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#f8fafc', fontSize: '16px', marginBottom: '8px' }}>
            No conversations yet
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '0.08em' }}>
            Accept connection requests on the Explore page to start chatting.
          </p>
        </div>
      )}

      {/* ── Conversation list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {conversations.map((conv) => {
          const other = conv.otherUser
          const hasUnread = conv.unreadCount > 0
          const preview = conv.lastMessage
            ? conv.lastMessage.content.slice(0, 60) + (conv.lastMessage.content.length > 60 ? '…' : '')
            : 'No messages yet — say hello!'

          return (
            <div
              key={conv.connectionId}
              onClick={() => router.push(`/messages/${conv.connectionId}`)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px',
                backgroundColor: '#16213e',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                border: hasUnread ? '1px solid #6c63ff33' : '1px solid transparent',
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e2a4a'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#16213e'}
            >
              {/* Avatar */}
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: '#6c63ff33',
                border: '2px solid #6c63ff55',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {other?.profile_photo ? (
                  <img
                    src={other.profile_photo}
                    alt={other.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 500,
                    color: '#a78bfa',
                    letterSpacing: '0.05em',
                  }}>
                    {getInitials(other?.name)}
                  </span>
                )}
              </div>

              {/* Name + preview */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '15px',
                    fontWeight: hasUnread ? 500 : 400,
                    color: '#f8fafc',
                    letterSpacing: '0.08em',
                  }}>
                    {other?.name || 'Unknown'}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}>
                    {formatTime(conv.lastMessage?.created_at || conv.createdAt)}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '13px',
                    color: hasUnread ? '#a78bfa' : '#94a3b8',
                    fontWeight: hasUnread ? 500 : 400,
                    letterSpacing: '0.05em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '340px',
                  }}>
                    {preview}
                  </span>

                  {/* Unread badge */}
                  {hasUnread && (
                    <span style={{
                      backgroundColor: '#6c63ff',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: 500,
                      borderRadius: '10px',
                      padding: '2px 7px',
                      flexShrink: 0,
                      marginLeft: '8px',
                    }}>
                      {conv.unreadCount}
                    </span>
                  )}
                </div>

                {/* College tag */}
                {other?.college && (
                  <span style={{
                    fontSize: '12px',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                    marginTop: '4px',
                    display: 'block',
                  }}>
                    {other.college}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}