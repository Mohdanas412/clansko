// app/(app)/explore/page.jsx
// Explore page — browse all users, send connection requests, filter by skills

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { UserCardSkeleton } from '@/components/Skeleton'

export default function ExplorePage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [currentUserId, setCurrentUserId] = useState(null)
  const [users, setUsers] = useState([])
  const [connections, setConnections] = useState([]) // all my connections
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState('') // single skill filter
  const [connectingTo, setConnectingTo] = useState(null) // userId being connected to right now

  // ── Supabase client (browser) ──────────────────────────────────────────────
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // ── On mount: get current user, then fetch data ────────────────────────────
  useEffect(() => {
    async function init() {
      try {
        // Get logged-in user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setCurrentUserId(user.id)
        await fetchData(user.id)
      } catch (err) {
        setError('Failed to load. Please refresh.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  async function handleRespond(connectionId) {
  try {
    const res = await fetch('/api/connections/respond', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connectionId,
        userId: currentUserId,
        status: 'accepted',
      }),
    })
    const data = await res.json()
    if (data.error) { toast.error(data.error); return }
    setConnections(prev =>
      prev.map(c =>
        c.connectionId === connectionId ? { ...c, status: 'accepted' } : c
      )
    )
    toast.success('Connected! 🎉')
  } catch (err) {
    toast.error('Something went wrong.')
  }
}

  // ── Fetch users + connections in parallel ──────────────────────────────────
  async function fetchData(userId) {
    // Run both API calls at the same time using Promise.all
    // Much faster than calling them one after the other
    const [usersRes, connectionsRes] = await Promise.all([
      fetch(`/api/users?userId=${userId}`),
      fetch(`/api/connections?userId=${userId}`),
    ])

    const usersData = await usersRes.json()
    const connectionsData = await connectionsRes.json()

    if (usersData.error) throw new Error(usersData.error)
    if (connectionsData.error) throw new Error(connectionsData.error)

    setUsers(usersData.data || [])
    setConnections(connectionsData.data || [])
  }

  // ── Work out connection status for any given userId ────────────────────────
  // Returns: { status: 'none' | 'pending' | 'accepted' | 'rejected', connectionId, direction }
  function getConnectionStatus(otherUserId) {
    const match = connections.find(c => c.otherUser?.id === otherUserId)
    if (!match) return { status: 'none' }
    return {
      status: match.status,
      connectionId: match.connectionId,
      direction: match.direction,
    }
  }

  // ── Send a connection request ──────────────────────────────────────────────
  async function handleConnect(receiverId) {
    setConnectingTo(receiverId) // show loading on this specific button
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId,
        }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
        return
      }
      // Optimistic update — add this new connection to local state immediately
      // No need to refetch everything
      setConnections(prev => [
        ...prev,
        {
          connectionId: data.data.id,
          status: 'pending',
          direction: 'sent',
          otherUser: { id: receiverId },
        },
      ])
      toast.success('Request sent!')
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setConnectingTo(null)
    }
  }

  // ── Filter logic ───────────────────────────────────────────────────────────
  const filteredUsers = users.filter(user => {
    // Search filter: matches name, college, or bio
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      !query ||
      user.name?.toLowerCase().includes(query) ||
      user.college?.toLowerCase().includes(query) ||
      user.bio?.toLowerCase().includes(query)

    // Skill filter: checks if user's skills array includes the selected skill
    const matchesSkill =
      !skillFilter ||
      (Array.isArray(user.skills) && user.skills.includes(skillFilter))

    return matchesSearch && matchesSkill
  })

  // ── Collect all unique skills across all users (for the filter dropdown) ───
  const allSkills = [...new Set(
    users.flatMap(u => Array.isArray(u.skills) ? u.skills : [])
  )].sort()

  // ── Loading state ──────────────────────────────────────────────────────────
 if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          {/* Header skeleton */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ width: '200px', height: '32px', backgroundColor: '#1e2a4a', borderRadius: '6px', marginBottom: '8px' }} />
            <div style={{ width: '150px', height: '16px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
          </div>
          {/* Card grid skeleton */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px',
          }}>
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
            <UserCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0f0f1a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <p style={{ color: '#f87171', fontSize: '16px' }}>{error}</p>
      </div>
    )
  }

  // ── Main render ────────────────────────────────────────────────────────────
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f0f1a',
      padding: '32px 24px',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 500,
            color: '#f8fafc',
            marginBottom: '8px',
            letterSpacing: '0.08em',
          }}>
            Find Your Clan
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8' }}>
            {users.length} builder{users.length !== 1 ? 's' : ''} on ClanSko
          </p>
        </div>

        {/* ── Search + Filter bar ── */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '32px',
          flexWrap: 'wrap',
        }}>
          {/* Search input */}
          <input
            type="text"
            placeholder="Search by name, college, or bio..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              minWidth: '220px',
              backgroundColor: '#16213e',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              padding: '10px 16px',
              color: '#f8fafc',
              fontSize: '15px',
              outline: 'none',
            }}
          />

          {/* Skill filter dropdown */}
          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            style={{
              backgroundColor: '#16213e',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              padding: '10px 16px',
              color: skillFilter ? '#f8fafc' : '#94a3b8',
              fontSize: '15px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '180px',
            }}
          >
            <option value="">All skills</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>

          {/* Clear filters button — only show when a filter is active */}
          {(searchQuery || skillFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setSkillFilter('') }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #2a2a4a',
                borderRadius: '8px',
                padding: '10px 16px',
                color: '#94a3b8',
                fontSize: '15px',
                cursor: 'pointer',
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* ── Empty state ── */}
        {filteredUsers.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '64px 0',
            color: '#94a3b8',
          }}>
            <p style={{ fontSize: '22px', marginBottom: '8px' }}>No builders found</p>
            <p style={{ fontSize: '15px' }}>
              {searchQuery || skillFilter
                ? 'Try a different search or filter.'
                : 'You\'re the first one here. Share ClanSko with your friends!'}
            </p>
          </div>
        )}

        {/* ── User cards grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          {filteredUsers.map(user => (
            <UserCard
             key={user.id}
             user={user}
             connectionInfo={getConnectionStatus(user.id)}
             onConnect={handleConnect}
             onRespond={handleRespond}
             isConnecting={connectingTo === user.id}
          />
          ))}
        </div>

      </div>
    </div>
  )
}

// ── UserCard component ─────────────────────────────────────────────────────
// Separate component keeps the main page clean and readable

function UserCard({ user, connectionInfo, onConnect, onRespond, isConnecting }) {
    const { status, direction } = connectionInfo

  // Work out what the connect button should show
  function getButtonConfig() {
    if (status === 'accepted') {
      return { label: 'Connected ✓', disabled: true, bgColor: '#16213e', color: '#22d3ee', border: '1px solid #22d3ee' }
    }
    if (status === 'pending' && direction === 'sent') {
      return { label: 'Pending...', disabled: true, bgColor: '#16213e', color: '#94a3b8', border: '1px solid #2a2a4a' }
    }
    if (status === 'pending' && direction === 'received') {
      return { label: 'Respond ↗', disabled: false, bgColor: '#6c63ff', color: '#ffffff', border: 'none' }
    }
    // default: no connection
    return { label: isConnecting ? 'Sending...' : 'Connect', disabled: isConnecting, bgColor: '#6c63ff', color: '#ffffff', border: 'none' }
  }

  const btnConfig = getButtonConfig()

  return (
    <div style={{
       backgroundColor: '#16213e',
       borderRadius: '12px',
       padding: '24px',
       border: '1px solid #2a2a4a',
       display: 'flex',
       flexDirection: 'column',
       gap: '16px',
       transition: 'border-color 0.2s',
    }}>

      {/* ── Top row: avatar + name + college ── */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        {/* Avatar — photo or initials fallback */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: '#6c63ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: 500,
          color: '#ffffff',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {user.profile_photo
            ? <img src={user.profile_photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : user.name?.charAt(0).toUpperCase()
          }
        </div>

        {/* Name + college */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
            <p style={{
              fontSize: '18px',
              fontWeight: 500,
              color: '#f8fafc',
              marginBottom: '2px',
              cursor: 'pointer',
            }}>
              {user.name}
            </p>
          </Link>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            {user.college || 'College not set'}
          </p>
          {user.branch && user.year && (
            <p style={{ fontSize: '13px', color: '#94a3b8' }}>
              {user.branch} · Year {user.year}
            </p>
          )}
        </div>
      </div>

      {/* ── Bio ── */}
      {user.bio && (
        <p style={{
          fontSize: '14px',
          color: '#94a3b8',
          lineHeight: '1.6',
          // Clamp to 3 lines so cards stay same height
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {user.bio}
        </p>
      )}

      {/* ── Skills chips ── */}
      {Array.isArray(user.skills) && user.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {user.skills.slice(0, 4).map(skill => ( // show max 4
            <span key={skill} style={{
              backgroundColor: '#1e1b4b',
              color: '#a78bfa',
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid #3730a3',
            }}>
              {skill}
            </span>
          ))}
          {user.skills.length > 4 && (
            <span style={{ fontSize: '12px', color: '#94a3b8', padding: '3px 0' }}>
              +{user.skills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* ── Looking for chips ── */}
      {Array.isArray(user.looking_for) && user.looking_for.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', marginRight: '2px' }}>Looking for:</span>
          {user.looking_for.map(item => (
            <span key={item} style={{
              backgroundColor: '#0f2c2c',
              color: '#22d3ee',
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '999px',
              border: '1px solid #164e4e',
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* ── Connect button ── */}
      <button
        onClick={() => {
  if (btnConfig.disabled) return
  if (status === 'pending' && direction === 'received') {
    onRespond(connectionInfo.connectionId)
  } else {
    onConnect(user.id)
  }
}}
        disabled={btnConfig.disabled}
        style={{
          marginTop: 'auto',
          backgroundColor: btnConfig.bgColor,
          color: btnConfig.color,
          border: btnConfig.border,
          borderRadius: '8px',
          padding: '10px 0',
          fontSize: '15px',
          fontWeight: 500,
          cursor: btnConfig.disabled ? 'not-allowed' : 'pointer',
          width: '100%',
          letterSpacing: '0.08em',
          transition: 'opacity 0.2s',
          opacity: isConnecting ? 0.7 : 1,
        }}
      >
        {btnConfig.label}
      </button>

    </div>
  )
}