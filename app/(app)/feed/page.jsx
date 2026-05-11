'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { PostCardSkeleton } from '@/components/Skeleton'

const STAGE_OPTIONS = [
  { value: 'idea', label: 'Idea' },
  { value: 'validation', label: 'Validating' },
  { value: 'building', label: 'Building' },
  { value: 'launched', label: 'Launched' },
]

const LOOKING_FOR_OPTIONS = [
  'Co-founder', 'Developer', 'Designer', 'Marketer',
  'Feedback', 'Mentor', 'Investor'
]

const REACTIONS = [
  { type: 'fire',      emoji: '🔥', label: 'Fire' },
  { type: 'eyes',      emoji: '👀', label: 'Interested' },
  { type: 'handshake', emoji: '🤝', label: 'Collab' },
]

const STAGE_STYLES = {
  idea:       { bg: '#1A1A1A', color: '#9A9A8A', border: '#2A2A2A' },
  validation: { bg: '#1A2A1A', color: '#4ADE80', border: '#166534' },
  building:   { bg: '#1A1F2A', color: '#60A5FA', border: '#1D4ED8' },
  launched:   { bg: '#2A1A0A', color: '#F97316', border: '#9A3412' },
}

function timeAgo(dateString) {
  const now = new Date()
  const then = new Date(dateString)
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

export default function FeedPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  const router = useRouter()

  const [currentUser, setCurrentUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [postTeams, setPostTeams] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [expandedPost, setExpandedPost] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', stage: '', looking_for: [] })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState(null)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setCurrentUser(user)
      await fetchPosts()
    }
    init()
  }, [])

  async function fetchPosts() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/posts')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load posts')
      const fetchedPosts = json.data || []
      setPosts(fetchedPosts)

      // Fetch team members for all posts in parallel
      const teamResults = await Promise.all(
        fetchedPosts.map(p =>
          fetch(`/api/projects/${p.id}`)
            .then(r => r.json())
            .then(j => ({
              postId: p.id,
              members: (j.data?.members || []).filter(m => m.status === 'accepted'),
            }))
            .catch(() => ({ postId: p.id, members: [] }))
        )
      )
      const teamMap = {}
      teamResults.forEach(({ postId, members }) => { teamMap[postId] = members })
      setPostTeams(teamMap)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleLookingFor(value) {
    setForm(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(value)
        ? prev.looking_for.filter(v => v !== value)
        : [...prev.looking_for, value]
    }))
  }

  async function handleCreatePost() {
    if (!currentUser) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setFormError('You must be logged in.'); return }
      setCurrentUser(user)
    }
    if (!form.title.trim() || !form.description.trim() || !form.stage) {
      setFormError('Title, description, and stage are required.')
      return
    }
    try {
      setFormLoading(true)
      setFormError(null)
      const res = await fetch('/api/posts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          title: form.title.trim(),
          description: form.description.trim(),
          stage: form.stage,
          looking_for: form.looking_for,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to create post')
      setForm({ title: '', description: '', stage: '', looking_for: [] })
      setShowModal(false)
      toast.success('Idea posted! 🚀')
      await fetchPosts()
    } catch (err) {
      setFormError(err.message)
      toast.error('Failed to post. Try again.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleReact(postId, type) {
    if (!currentUser) return
    try {
      const res = await fetch('/api/posts/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, postId, type }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post
        const oldReactions = { ...post.reactions }
        const oldUserReaction = post.reactions_by_user?.[currentUser.id]
        if (oldUserReaction) {
          oldReactions[oldUserReaction] = Math.max(0, (oldReactions[oldUserReaction] || 1) - 1)
        }
        const newUserReaction = json.data.action === 'removed' ? null : type
        if (newUserReaction) {
          oldReactions[newUserReaction] = (oldReactions[newUserReaction] || 0) + 1
        }
        return {
          ...post,
          reactions: oldReactions,
          reactions_by_user: { ...post.reactions_by_user, [currentUser.id]: newUserReaction },
        }
      }))
    } catch (err) {
      toast.error('Failed to react. Try again.')
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111111' }}>
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>

        {/* Header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <div style={{ width: '28px', height: '3px', background: '#F97316', borderRadius: '2px' }} />
                <span style={{ fontSize: '12px', color: '#F97316', letterSpacing: '0.1em', fontWeight: 500, textTransform: 'uppercase' }}>
                  Builder Feed
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 600, color: '#F5F0E8', letterSpacing: '-0.01em' }}>
                What are people building?
              </h1>
              <p style={{ fontSize: '14px', color: '#6A6A5A', marginTop: '4px' }}>
                Ideas, projects, and teams forming in real time.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                backgroundColor: '#F97316',
                color: '#111',
                border: 'none',
                borderRadius: '6px',
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'background 0.2s',
              }}
            >
              + Post Idea
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <>
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </>
        )}

        {/* Error */}
        {error && !loading && (
          <div style={{
            backgroundColor: '#1A1A1A',
            border: '1px solid #3A1A1A',
            borderRadius: '10px',
            padding: '16px',
            color: '#FCA5A5',
            marginBottom: '24px',
            fontSize: '14px',
          }}>
            {error}
            <button onClick={fetchPosts} style={{ marginLeft: '12px', color: '#F97316', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}>
              Retry
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && posts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '64px 0',
            border: '1px dashed #2A2A2A',
            borderRadius: '12px',
          }}>
            <p style={{ fontSize: '16px', color: '#F5F0E8', marginBottom: '8px', fontWeight: 500 }}>
              No posts yet.
            </p>
            <p style={{ fontSize: '14px', color: '#6A6A5A' }}>
              Be the first builder to post an idea.
            </p>
          </div>
        )}

        {/* Posts */}
        {!loading && posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUser?.id}
            onReact={handleReact}
            onExpand={() => setExpandedPost(post)}
            teamMembers={postTeams[post.id] || []}
            router={router}
          />
        ))}
      </main>

      {/* Create Post Modal */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setFormError(null) }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#F5F0E8', marginBottom: '4px' }}>
              Share your idea
            </h2>
            <p style={{ fontSize: '13px', color: '#6A6A5A' }}>
              Tell the community what you&apos;re building.
            </p>
          </div>

          <label style={labelStyle}>TITLE *</label>
          <input
            placeholder="e.g. AI study partner for tier-3 colleges"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            style={inputStyle}
            maxLength={100}
          />

          <label style={labelStyle}>DESCRIPTION *</label>
          <textarea
            placeholder="Describe the problem, your solution, and where you&apos;re at..."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            style={{ ...inputStyle, height: '110px', resize: 'vertical' }}
            maxLength={1000}
          />

          <label style={labelStyle}>STAGE *</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            {STAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(p => ({ ...p, stage: opt.value }))}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  border: '1px solid',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: form.stage === opt.value ? '#F97316' : 'transparent',
                  borderColor: form.stage === opt.value ? '#F97316' : '#2A2A2A',
                  color: form.stage === opt.value ? '#111' : '#9A9A8A',
                  fontWeight: form.stage === opt.value ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label style={labelStyle}>LOOKING FOR <span style={{ color: '#6A6A5A', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {LOOKING_FOR_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => toggleLookingFor(opt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: form.looking_for.includes(opt) ? '#F9731615' : 'transparent',
                  borderColor: form.looking_for.includes(opt) ? '#F97316' : '#2A2A2A',
                  color: form.looking_for.includes(opt) ? '#F97316' : '#9A9A8A',
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {formError && (
            <p style={{ color: '#FCA5A5', fontSize: '13px', marginBottom: '16px' }}>{formError}</p>
          )}

          <button
            onClick={handleCreatePost}
            disabled={formLoading}
            style={{
              width: '100%',
              backgroundColor: formLoading ? '#2A2A2A' : '#F97316',
              color: formLoading ? '#6A6A5A' : '#111',
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: formLoading ? 'not-allowed' : 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {formLoading ? 'Posting...' : 'Post Idea →'}
          </button>
        </Modal>
      )}

      {/* Expanded Post */}
      {expandedPost && (
        <ExpandedPost
          post={expandedPost}
          currentUser={currentUser}
          onClose={() => setExpandedPost(null)}
          onReact={handleReact}
          onCommentAdded={(postId) => {
            setPosts(prev => prev.map(p =>
              p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p
            ))
          }}
        />
      )}
    </div>
  )
}

// ── Post Card ──────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId, onReact, onExpand, teamMembers, router }) {
  const userReaction = post.reactions_by_user?.[currentUserId]
  const stage = STAGE_STYLES[post.stage] || STAGE_STYLES.idea
  const isOwner = post.user_id === currentUserId

  return (
    <div
      style={{
        backgroundColor: '#161616',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '12px',
        border: '1px solid #1E1E1E',
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#2A2A2A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1E'}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#F9731620',
          border: '1px solid #F9731640',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 600, color: '#F97316', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {post.users?.profile_photo
            ? <img src={post.users.profile_photo} alt={post.users.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : post.users?.name?.charAt(0).toUpperCase() || '?'
          }
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#F5F0E8', margin: 0 }}>
            {post.users?.name || 'Unknown'}
          </p>
          <p style={{ fontSize: '12px', color: '#6A6A5A', margin: 0 }}>
            {post.users?.college || ''} · {timeAgo(post.created_at)}
          </p>
        </div>
        <span style={{
          padding: '3px 10px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 500,
          backgroundColor: stage.bg,
          color: stage.color,
          border: `1px solid ${stage.border}`,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {post.stage}
        </span>
      </div>

      {/* Title + description */}
      <h3
        onClick={onExpand}
        style={{ fontSize: '16px', fontWeight: 600, marginBottom: '6px', color: '#F5F0E8', lineHeight: 1.4, cursor: 'pointer' }}
      >
        {post.title}
      </h3>
      <p style={{
        fontSize: '14px', color: '#6A6A5A', marginBottom: '14px',
        lineHeight: 1.7,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {post.description}
      </p>

      {/* Looking for */}
      {post.looking_for?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {post.looking_for.map(item => (
            <span key={item} style={{
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              backgroundColor: '#F9731610',
              color: '#F97316',
              border: '1px solid #F9731630',
              fontWeight: 500,
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Team row */}
      {(teamMembers.length > 0 || isOwner) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px', paddingBottom: '14px', borderBottom: '1px solid #1E1E1E',
          gap: 10, flexWrap: 'wrap',
        }}>
          {/* Avatars + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {teamMembers.length > 0 ? (
              <>
                <div style={{ display: 'flex' }}>
                  {teamMembers.slice(0, 4).map((m, i) => (
                    <div
                      key={m.id}
                      title={m.profile?.name}
                      style={{
                        width: 26, height: 26, borderRadius: '50%',
                        background: '#F9731620', border: '2px solid #161616',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 600, color: '#F97316',
                        marginLeft: i === 0 ? 0 : -8,
                        overflow: 'hidden', flexShrink: 0,
                        position: 'relative', zIndex: teamMembers.length - i,
                      }}
                    >
                      {m.profile?.profile_photo
                        ? <img src={m.profile.profile_photo} alt={m.profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : m.profile?.name?.charAt(0).toUpperCase() || '?'
                      }
                    </div>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: '#6A6A5A' }}>
                  {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => router.push(`/projects/${post.id}`)}
                  style={{
                    background: 'none', border: 'none', color: '#F97316',
                    fontSize: 12, cursor: 'pointer', padding: 0,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  View team →
                </button>
              </>
            ) : (
              <span style={{ fontSize: 12, color: '#6A6A5A' }}>No team members yet</span>
            )}
          </div>

          {/* Invite button — owner only */}
          {isOwner && (
            <button
              onClick={() => router.push(`/projects/${post.id}`)}
              style={{
                background: 'transparent', border: '1px solid #2A2A2A',
                color: '#F97316', borderRadius: 6,
                padding: '5px 12px', fontSize: 12, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              }}
            >
              + Invite to team
            </button>
          )}
        </div>
      )}

      {/* Reactions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingTop: '14px', borderTop: '1px solid #1E1E1E' }}>
        {REACTIONS.map(r => (
          <button
            key={r.type}
            onClick={(e) => { e.stopPropagation(); onReact(post.id, r.type) }}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px',
              borderRadius: '6px',
              border: '1px solid',
              fontSize: '12px',
              cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              backgroundColor: userReaction === r.type ? '#F9731615' : 'transparent',
              borderColor: userReaction === r.type ? '#F97316' : '#2A2A2A',
              color: userReaction === r.type ? '#F97316' : '#6A6A5A',
              transition: 'all 0.15s',
            }}
          >
            {r.emoji} <span>{post.reactions?.[r.type] || 0}</span>
          </button>
        ))}
        <button
          onClick={onExpand}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #2A2A2A',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: '#6A6A5A',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          💬 {post.comment_count || 0}
        </button>
      </div>
    </div>
  )
}

// ── Modal ──────────────────────────────────────────────────────────────────────
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: '#00000090',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#161616',
          borderRadius: '14px',
          padding: '28px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #2A2A2A',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Shared styles ──────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: '11px',
  color: '#6A6A5A',
  marginBottom: '8px',
  letterSpacing: '0.1em',
  fontWeight: 600,
  textTransform: 'uppercase',
}

const inputStyle = {
  width: '100%',
  backgroundColor: '#111111',
  border: '1px solid #2A2A2A',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#F5F0E8',
  fontSize: '14px',
  marginBottom: '20px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: "'DM Sans', sans-serif",
  lineHeight: '1.5',
}

// ── Expanded Post ──────────────────────────────────────────────────────────────
function ExpandedPost({ post, currentUser, onClose, onReact, onCommentAdded }) {
  const [fullPost, setFullPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comment, setComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState(null)

  const userReaction = (fullPost || post).reactions_by_user?.[currentUser?.id]

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const res = await fetch(`/api/posts/${post.id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load post')
        setFullPost(json.data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [post.id])

  async function handleComment() {
    if (!comment.trim()) return
    try {
      setCommentLoading(true)
      setCommentError(null)
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, postId: post.id, content: comment.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to post comment')
      setFullPost(prev => ({ ...prev, comments: [...(prev.comments || []), json.data] }))
      setComment('')
      onCommentAdded(post.id)
      toast.success('Comment posted!')
    } catch (err) {
      setCommentError(err.message)
      toast.error('Failed to post comment.')
    } finally {
      setCommentLoading(false)
    }
  }

  const displayPost = fullPost || post
  const stage = STAGE_STYLES[displayPost.stage] || STAGE_STYLES.idea

  return (
    <Modal onClose={onClose}>
      <div style={{ marginBottom: '20px' }}>
        <span style={{
          padding: '3px 10px', borderRadius: '4px', fontSize: '11px',
          fontWeight: 500, backgroundColor: stage.bg,
          color: stage.color, border: `1px solid ${stage.border}`,
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          {displayPost.stage}
        </span>
        <h2 style={{ fontSize: '20px', fontWeight: 600, marginTop: '12px', color: '#F5F0E8', lineHeight: 1.3 }}>
          {displayPost.title}
        </h2>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#F9731620', border: '1px solid #F9731640',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 600, color: '#F97316',
          overflow: 'hidden',
        }}>
          {displayPost.users?.profile_photo
            ? <img src={displayPost.users.profile_photo} alt={displayPost.users.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : displayPost.users?.name?.charAt(0).toUpperCase() || '?'
          }
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#F5F0E8', margin: 0 }}>{displayPost.users?.name}</p>
          <p style={{ fontSize: '12px', color: '#6A6A5A', margin: 0 }}>{displayPost.users?.college} · {timeAgo(displayPost.created_at)}</p>
        </div>
      </div>

      <p style={{ fontSize: '15px', color: '#9A9A8A', lineHeight: 1.8, marginBottom: '16px' }}>
        {displayPost.description}
      </p>

      {displayPost.looking_for?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {displayPost.looking_for.map(item => (
            <span key={item} style={{
              padding: '4px 12px', borderRadius: '4px', fontSize: '12px',
              backgroundColor: '#F9731610', color: '#F97316', border: '1px solid #F9731630',
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {REACTIONS.map(r => (
          <button
            key={r.type}
            onClick={() => onReact(displayPost.id, r.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '6px', border: '1px solid',
              fontSize: '13px', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              backgroundColor: userReaction === r.type ? '#F9731615' : 'transparent',
              borderColor: userReaction === r.type ? '#F97316' : '#2A2A2A',
              color: userReaction === r.type ? '#F97316' : '#6A6A5A',
              transition: 'all 0.15s',
            }}
          >
            {r.emoji} {displayPost.reactions?.[r.type] || 0}
          </button>
        ))}
      </div>

      <div style={{ borderTop: '1px solid #1E1E1E', marginBottom: '20px' }} />

      <p style={{ fontSize: '11px', color: '#6A6A5A', marginBottom: '16px', letterSpacing: '0.1em', fontWeight: 600 }}>
        COMMENTS {loading ? '' : `· ${fullPost?.comments?.length || 0}`}
      </p>

      {loading && <p style={{ color: '#6A6A5A', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>Loading...</p>}
      {error && <p style={{ color: '#FCA5A5', fontSize: '14px' }}>{error}</p>}

      {!loading && fullPost?.comments?.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: '#F9731615', border: '1px solid #F9731630',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600, color: '#F97316',
          }}>
            {c.users?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ backgroundColor: '#111111', borderRadius: '8px', padding: '10px 14px', flex: 1, border: '1px solid #1E1E1E' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#F5F0E8' }}>{c.users?.name || 'Unknown'}</span>
              <span style={{ fontSize: '11px', color: '#6A6A5A' }}>{timeAgo(c.created_at)}</span>
            </div>
            <p style={{ fontSize: '14px', color: '#9A9A8A', margin: 0, lineHeight: 1.6 }}>{c.content}</p>
          </div>
        </div>
      ))}

      {!loading && fullPost?.comments?.length === 0 && (
        <p style={{ color: '#6A6A5A', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>
          No comments yet. Start the conversation.
        </p>
      )}

      <div style={{ marginTop: '20px' }}>
        <textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ ...inputStyle, height: '80px', resize: 'none', marginBottom: '8px' }}
          maxLength={500}
        />
        {commentError && <p style={{ color: '#FCA5A5', fontSize: '13px', marginBottom: '8px' }}>{commentError}</p>}
        <button
          onClick={handleComment}
          disabled={commentLoading || !comment.trim()}
          style={{
            backgroundColor: commentLoading || !comment.trim() ? '#2A2A2A' : '#F97316',
            color: commentLoading || !comment.trim() ? '#6A6A5A' : '#111',
            border: 'none', borderRadius: '6px',
            padding: '10px 20px', fontSize: '14px', fontWeight: 600,
            cursor: commentLoading || !comment.trim() ? 'not-allowed' : 'pointer',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {commentLoading ? 'Posting...' : 'Comment →'}
        </button>
      </div>
    </Modal>
  )
}