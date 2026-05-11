'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function ProjectPage({ params }) {
  const { id } = params
  const router = useRouter()

  const [project, setProject] = useState(null)
  const [author, setAuthor] = useState(null)
  const [members, setMembers] = useState([])
  const [isOwner, setIsOwner] = useState(false)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [connections, setConnections] = useState([])
  const [connectionsLoading, setConnectionsLoading] = useState(false)
  const [inviting, setInviting] = useState(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    fetchProject()
  }, [id])

  async function fetchProject() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/projects/${id}`)
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Failed to load project')
        return
      }
      setProject(json.data.project)
      setAuthor(json.data.author)
      setMembers(json.data.members)
      setIsOwner(json.data.isOwner)
      setCurrentUserId(json.data.currentUserId)
    } catch (err) {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function openInviteModal() {
  setShowInviteModal(true)
  setConnectionsLoading(true)
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const res = await fetch(`/api/connections?userId=${user.id}`)
    const json = await res.json()
    if (!res.ok) throw new Error()

    const teamUserIds = members.map(m => m.user_id)

    // Only accepted connections, not already on team
    const eligible = (json.data || [])
      .filter(c => c.status === 'accepted' && !teamUserIds.includes(c.otherUser?.id))
      .map(c => c.otherUser)  // flatten to just the user object

    setConnections(eligible)
  } catch {
    toast.error('Could not load connections')
  } finally {
    setConnectionsLoading(false)
  }
}

  async function invitePerson(userId) {
    setInviting(userId)
    try {
      const res = await fetch('/api/projects/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: id, user_id: userId }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to send invite')
        return
      }
      toast.success('Invite sent!')
      setShowInviteModal(false)
      fetchProject()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setInviting(null)
    }
  }

  async function respondToInvite(inviteId, action) {
    try {
      const res = await fetch('/api/projects/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invite_id: inviteId, action }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || 'Failed to respond')
        return
      }
      toast.success(action === 'accepted' ? 'You joined the team!' : 'Invite declined')
      fetchProject()
    } catch {
      toast.error('Something went wrong')
    }
  }

  const acceptedMembers = members.filter(m => m.status === 'accepted')
  const pendingMembers = members.filter(m => m.status === 'pending')
  const myInvite = members.find(
    m => m.user_id === currentUserId && m.status === 'pending'
  )

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ height: 32, width: 260, background: '#1E1E1E', borderRadius: 8, marginBottom: 16 }} />
        <div style={{ height: 120, background: '#161616', borderRadius: 12, marginBottom: 24 }} />
        <div style={{ height: 200, background: '#161616', borderRadius: 12 }} />
      </div>
    )
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <p style={{ color: '#FCA5A5', marginBottom: 16 }}>{error}</p>
        <button onClick={() => router.push('/feed')} style={{
          background: '#F97316', color: '#111', border: 'none',
          borderRadius: 6, padding: '10px 20px', fontWeight: 600, cursor: 'pointer'
        }}>
          Back to Feed
        </button>
      </div>
    )
  }

  // ── Page ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 20px' }}>

      {/* My pending invite banner */}
      {myInvite && (
        <div style={{
          background: '#F9731610', border: '1px solid #F9731640',
          borderRadius: 12, padding: '16px 20px', marginBottom: 24,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap'
        }}>
          <p style={{ color: '#F5F0E8', margin: 0, fontSize: 14 }}>
            You&apos;ve been invited to join this team
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => respondToInvite(myInvite.id, 'accepted')} style={{
              background: '#F97316', color: '#111', border: 'none',
              borderRadius: 6, padding: '8px 18px', fontWeight: 600,
              cursor: 'pointer', fontSize: 14
            }}>
              Accept
            </button>
            <button onClick={() => respondToInvite(myInvite.id, 'declined')} style={{
              background: 'transparent', color: '#9A9A8A',
              border: '1px solid #2A2A2A', borderRadius: 6,
              padding: '8px 18px', cursor: 'pointer', fontSize: 14
            }}>
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Project card */}
      <div style={{
        background: '#161616', border: '1px solid #1E1E1E',
        borderRadius: 12, padding: '28px 28px 24px', marginBottom: 24
      }}>
        {/* Stage tag */}
        <div style={{ marginBottom: 14 }}>
          <span style={{
            background: '#F9731610', color: '#F97316',
            border: '1px solid #F9731630', borderRadius: 20,
            padding: '4px 12px', fontSize: 12, fontWeight: 500
          }}>
            {project.stage || 'Idea'}
          </span>
        </div>

        <h1 style={{
          fontFamily: '"DM Serif Display", serif',
          fontSize: 28, color: '#F5F0E8', margin: '0 0 12px'
        }}>
          {project.title}
        </h1>

        <p style={{ color: '#9A9A8A', fontSize: 15, lineHeight: 1.7, margin: '0 0 20px' }}>
          {project.description}
        </p>

        {project.looking_for && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ color: '#6A6A5A', fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Looking for
            </span>
            {(Array.isArray(project.looking_for)
              ? project.looking_for
              : [project.looking_for]
            ).map((role, i) => (
              <span key={i} style={{
                background: '#1E1E1E', color: '#9A9A8A',
                borderRadius: 20, padding: '3px 10px', fontSize: 12
              }}>
                {role}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Author */}
      {author && (
        <div
          onClick={() => router.push(`/profile/${author.id}`)}
          style={{
            background: '#161616', border: '1px solid #1E1E1E',
            borderRadius: 12, padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer'
          }}
        >
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: '#F9731620', border: '1px solid #F9731640',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 600, color: '#F97316', flexShrink: 0,
            overflow: 'hidden'
          }}>
            {author.profile_photo
              ? <img src={author.profile_photo} alt={author.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : author.name?.charAt(0).toUpperCase()
            }
          </div>
          <div>
            <p style={{ color: '#F5F0E8', fontWeight: 600, margin: 0, fontSize: 15 }}>
              {author.name}
              <span style={{
                marginLeft: 8, fontSize: 11, fontWeight: 500,
                color: '#F97316', background: '#F9731610',
                border: '1px solid #F9731630', borderRadius: 20,
                padding: '2px 8px', textTransform: 'uppercase', letterSpacing: '0.05em'
              }}>
                Founder
              </span>
            </p>
            <p style={{ color: '#6A6A5A', fontSize: 13, margin: '2px 0 0' }}>
              {author.college} · {author.branch} · Year {author.year}
            </p>
          </div>
        </div>
      )}

      {/* Team section */}
      <div style={{
        background: '#161616', border: '1px solid #1E1E1E',
        borderRadius: 12, padding: '24px 24px 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ width: 28, height: 3, background: '#F97316', borderRadius: 2, marginBottom: 8 }} />
            <h2 style={{
              fontFamily: '"DM Serif Display", serif',
              fontSize: 20, color: '#F5F0E8', margin: 0
            }}>
              Team
            </h2>
          </div>
          {isOwner && (
            <button onClick={openInviteModal} style={{
              background: '#F97316', color: '#111', border: 'none',
              borderRadius: 6, padding: '8px 18px', fontWeight: 600,
              fontSize: 14, cursor: 'pointer'
            }}>
              + Invite
            </button>
          )}
        </div>

        {/* Accepted members */}
        {acceptedMembers.length === 0 && (
          <p style={{ color: '#6A6A5A', fontSize: 14, margin: '0 0 16px' }}>
            No team members yet.
          </p>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {acceptedMembers.map(m => (
            <MemberRow
              key={m.id}
              member={m}
              onProfileClick={() => router.push(`/profile/${m.user_id}`)}
            />
          ))}
        </div>

        {/* Pending invites — visible to owner only */}
        {isOwner && pendingMembers.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <p style={{
              color: '#6A6A5A', fontSize: 11, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10
            }}>
              Pending invites
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pendingMembers.map(m => (
                <MemberRow key={m.id} member={m} pending />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <InviteModal
          connections={connections}
          loading={connectionsLoading}
          inviting={inviting}
          onInvite={invitePerson}
          onClose={() => setShowInviteModal(false)}
        />
      )}
    </div>
  )
}

// ── Member row ────────────────────────────────────────────────────────────────
function MemberRow({ member, pending = false, onProfileClick }) {
  const p = member.profile
  if (!p) return null

  return (
    <div
      onClick={onProfileClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 10,
        border: '1px solid #1E1E1E', cursor: onProfileClick ? 'pointer' : 'default',
        transition: 'border-color 0.2s',
        opacity: pending ? 0.6 : 1,
      }}
      onMouseEnter={e => { if (onProfileClick) e.currentTarget.style.borderColor = '#2A2A2A' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E1E1E' }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%',
        background: '#F9731620', border: '1px solid #F9731640',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 600, color: '#F97316', flexShrink: 0,
        overflow: 'hidden'
      }}>
        {p.profile_photo
          ? <img src={p.profile_photo} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : p.name?.charAt(0).toUpperCase()
        }
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#F5F0E8', fontWeight: 600, margin: 0, fontSize: 14 }}>
          {p.name}
        </p>
        <p style={{ color: '#6A6A5A', fontSize: 12, margin: '2px 0 0' }}>
          {p.college} · {member.role}
        </p>
      </div>
      {pending && (
        <span style={{
          fontSize: 11, color: '#9A9A8A', background: '#1E1E1E',
          borderRadius: 20, padding: '3px 10px'
        }}>
          Pending
        </span>
      )}
    </div>
  )
}

// ── Invite modal ──────────────────────────────────────────────────────────────
function InviteModal({ connections, loading, inviting, onInvite, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#161616', border: '1px solid #1E1E1E',
          borderRadius: 16, padding: 28, width: '100%', maxWidth: 460,
          maxHeight: '80vh', overflowY: 'auto'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: 20, color: '#F5F0E8', margin: 0
          }}>
            Invite to team
          </h3>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#6A6A5A',
            fontSize: 22, cursor: 'pointer', lineHeight: 1
          }}>×</button>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 60, background: '#1E1E1E', borderRadius: 10 }} />
            ))}
          </div>
        )}

        {!loading && connections.length === 0 && (
          <p style={{ color: '#6A6A5A', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>
            No connections to invite. Connect with more builders first.
          </p>
        )}

        {!loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {connections.map(c => (
              <div key={c.id} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', borderRadius: 10,
                border: '1px solid #1E1E1E'
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%',
                  background: '#F9731620', border: '1px solid #F9731640',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 600, color: '#F97316', flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  {c.profile_photo
                    ? <img src={c.profile_photo} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : c.name?.charAt(0).toUpperCase()
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: '#F5F0E8', fontWeight: 600, margin: 0, fontSize: 14 }}>{c.name}</p>
                  <p style={{ color: '#6A6A5A', fontSize: 12, margin: '2px 0 0' }}>{c.college}</p>
                </div>
                <button
                  onClick={() => onInvite(c.id)}
                  disabled={inviting === c.id}
                  style={{
                    background: inviting === c.id ? '#2A2A2A' : '#F97316',
                    color: inviting === c.id ? '#6A6A5A' : '#111',
                    border: 'none', borderRadius: 6,
                    padding: '7px 16px', fontWeight: 600,
                    fontSize: 13, cursor: inviting === c.id ? 'not-allowed' : 'pointer'
                  }}
                >
                  {inviting === c.id ? 'Inviting...' : 'Invite'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}