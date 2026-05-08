// app/(app)/explore/page.jsx
'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { UserCardSkeleton } from '@/components/Skeleton'

export default function ExplorePage() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [users, setUsers] = useState([])
  const [connections, setConnections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [skillFilter, setSkillFilter] = useState('')
  const [connectingTo, setConnectingTo] = useState(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    async function init() {
      try {
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

  async function fetchData(userId) {
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

  async function handleRespond(connectionId) {
    try {
      const res = await fetch('/api/connections/respond', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, userId: currentUserId, status: 'accepted' }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setConnections(prev =>
        prev.map(c => c.connectionId === connectionId ? { ...c, status: 'accepted' } : c)
      )
      toast.success('Connected! 🎉')
    } catch (err) {
      toast.error('Something went wrong.')
    }
  }

  async function handleConnect(receiverId) {
    setConnectingTo(receiverId)
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUserId, receiverId }),
      })
      const data = await res.json()
      if (data.error) { toast.error(data.error); return }
      setConnections(prev => [...prev, {
        connectionId: data.data.id,
        status: 'pending',
        direction: 'sent',
        otherUser: { id: receiverId },
      }])
      toast.success('Request sent!')
    } catch (err) {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setConnectingTo(null)
    }
  }

  function getConnectionStatus(otherUserId) {
    const match = connections.find(c => c.otherUser?.id === otherUserId)
    if (!match) return { status: 'none' }
    return { status: match.status, connectionId: match.connectionId, direction: match.direction }
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase()
    const matchesSearch = !query ||
      user.name?.toLowerCase().includes(query) ||
      user.college?.toLowerCase().includes(query) ||
      user.bio?.toLowerCase().includes(query)
    const matchesSkill = !skillFilter ||
      (Array.isArray(user.skills) && user.skills.includes(skillFilter))
    return matchesSearch && matchesSkill
  })

  const allSkills = [...new Set(
    users.flatMap(u => Array.isArray(u.skills) ? u.skills : [])
  )].sort()

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111111', padding: '32px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ width: '200px', height: '28px', backgroundColor: '#1A1A1A', borderRadius: '6px', marginBottom: '8px' }} />
            <div style={{ width: '150px', height: '14px', backgroundColor: '#1A1A1A', borderRadius: '6px' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            <UserCardSkeleton /><UserCardSkeleton /><UserCardSkeleton />
            <UserCardSkeleton /><UserCardSkeleton /><UserCardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#111111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#FCA5A5', fontSize: '16px' }}>{error}</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111111', padding: '32px 24px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '28px', height: '3px', background: '#F97316', borderRadius: '2px' }} />
            <span style={{ fontSize: '12px', color: '#F97316', letterSpacing: '0.1em', fontWeight: 500, textTransform: 'uppercase' }}>
              Explore
            </span>
          </div>
          <h1 style={{ fontSize: 'clamp(22px, 4vw, 32px)', fontWeight: 600, color: '#F5F0E8', letterSpacing: '-0.01em', marginBottom: '4px' }}>
            Find your people
          </h1>
          <p style={{ fontSize: '14px', color: '#6A6A5A' }}>
            {users.length} builder{users.length !== 1 ? 's' : ''} on ClanSko
          </p>
        </div>

        {/* Search + Filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Search by name, college, or bio..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              flex: 1, minWidth: '220px',
              backgroundColor: '#161616',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              padding: '10px 16px',
              color: '#F5F0E8',
              fontSize: '14px',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <select
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            style={{
              backgroundColor: '#161616',
              border: '1px solid #2A2A2A',
              borderRadius: '8px',
              padding: '10px 16px',
              color: skillFilter ? '#F5F0E8' : '#6A6A5A',
              fontSize: '14px',
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <option value="">All skills</option>
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
          {(searchQuery || skillFilter) && (
            <button
              onClick={() => { setSearchQuery(''); setSkillFilter('') }}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #2A2A2A',
                borderRadius: '8px',
                padding: '10px 16px',
                color: '#9A9A8A',
                fontSize: '14px',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Empty state */}
        {filteredUsers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0', border: '1px dashed #2A2A2A', borderRadius: '12px' }}>
            <p style={{ fontSize: '18px', color: '#F5F0E8', marginBottom: '8px', fontWeight: 500 }}>No builders found</p>
            <p style={{ fontSize: '14px', color: '#6A6A5A' }}>
              {searchQuery || skillFilter ? 'Try a different search or filter.' : "You're the first one here. Share ClanSko!"}
            </p>
          </div>
        )}

        {/* User cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
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

function UserCard({ user, connectionInfo, onConnect, onRespond, isConnecting }) {
  const { status, direction } = connectionInfo

  function getButtonConfig() {
    if (status === 'accepted') return { label: 'Connected ✓', disabled: true, bg: '#1A2A1A', color: '#4ADE80', border: '1px solid #166534' }
    if (status === 'pending' && direction === 'sent') return { label: 'Pending...', disabled: true, bg: 'transparent', color: '#6A6A5A', border: '1px solid #2A2A2A' }
    if (status === 'pending' && direction === 'received') return { label: 'Respond →', disabled: false, bg: '#F97316', color: '#111', border: 'none' }
    return { label: isConnecting ? 'Sending...' : 'Connect →', disabled: isConnecting, bg: '#F97316', color: '#111', border: 'none' }
  }

  const btn = getButtonConfig()

  return (
    <div style={{
      backgroundColor: '#161616',
      borderRadius: '12px',
      padding: '24px',
      border: '1px solid #1E1E1E',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2A2A2A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1E'}
    >
      {/* Avatar + name */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          backgroundColor: '#F9731620',
          border: '1px solid #F9731640',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: 600, color: '#F97316', flexShrink: 0,
        }}>
          {user.profile_photo
            ? <img src={user.profile_photo} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
            : user.name?.charAt(0).toUpperCase()
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link href={`/profile/${user.id}`} style={{ textDecoration: 'none' }}>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#F5F0E8', marginBottom: '2px', cursor: 'pointer' }}>
              {user.name}
            </p>
          </Link>
          <p style={{ fontSize: '12px', color: '#6A6A5A' }}>{user.college || 'College not set'}</p>
          {user.branch && user.year && (
            <p style={{ fontSize: '12px', color: '#6A6A5A' }}>{user.branch} · Year {user.year}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {user.bio && (
        <p style={{
          fontSize: '13px', color: '#9A9A8A', lineHeight: 1.7,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {user.bio}
        </p>
      )}

      {/* Skills */}
      {Array.isArray(user.skills) && user.skills.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {user.skills.slice(0, 4).map(skill => (
            <span key={skill} style={{
              backgroundColor: '#1A1A2A',
              color: '#9A9A8A',
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1px solid #2A2A3A',
              fontWeight: 500,
            }}>
              {skill}
            </span>
          ))}
          {user.skills.length > 4 && (
            <span style={{ fontSize: '11px', color: '#6A6A5A', padding: '3px 0' }}>
              +{user.skills.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Looking for */}
      {Array.isArray(user.looking_for) && user.looking_for.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', color: '#6A6A5A' }}>Looking for:</span>
          {user.looking_for.map(item => (
            <span key={item} style={{
              backgroundColor: '#F9731610',
              color: '#F97316',
              fontSize: '11px',
              padding: '3px 10px',
              borderRadius: '4px',
              border: '1px solid #F9731630',
              fontWeight: 500,
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Connect button */}
      <button
        onClick={() => {
          if (btn.disabled) return
          if (status === 'pending' && direction === 'received') onRespond(connectionInfo.connectionId)
          else onConnect(user.id)
        }}
        disabled={btn.disabled}
        style={{
          marginTop: 'auto',
          backgroundColor: btn.bg,
          color: btn.color,
          border: btn.border,
          borderRadius: '8px',
          padding: '11px 0',
          fontSize: '14px',
          fontWeight: 600,
          cursor: btn.disabled ? 'not-allowed' : 'pointer',
          width: '100%',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'opacity 0.2s',
          opacity: isConnecting ? 0.7 : 1,
        }}
      >
        {btn.label}
      </button>
    </div>
  )
}