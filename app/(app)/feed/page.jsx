// app/(app)/feed/page.jsx
// The main feed — shows all posts, create post modal, reactions

'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// ─── STAGE OPTIONS for the create post form ───────────────────────────────
const STAGE_OPTIONS = [
  { value: 'idea', label: '💡 Just an Idea' },
  { value: 'validation', label: '🔍 Validating' },
  { value: 'building', label: '🛠️ Building' },
  { value: 'launched', label: '🚀 Launched' },
]

// ─── LOOKING FOR OPTIONS ───────────────────────────────────────────────────
const LOOKING_FOR_OPTIONS = [
  'Co-founder', 'Developer', 'Designer', 'Marketer',
  'Feedback', 'Mentor', 'Investor'
]

// ─── REACTION TYPES ───────────────────────────────────────────────────────
const REACTIONS = [
  { type: 'fire',      emoji: '🔥', label: 'Fire' },
  { type: 'eyes',      emoji: '👀', label: 'Interested' },
  { type: 'handshake', emoji: '🤝', label: 'Want to collab' },
]

// ─── HELPER: format date to "2 hours ago" style ───────────────────────────
function timeAgo(dateString) {
  const now = new Date()
  const then = new Date(dateString)
  const seconds = Math.floor((now - then) / 1000)
  if (seconds < 60)   return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function FeedPage() {
  // Create supabase client correctly for client components
  const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
  const router = useRouter()

  // ─── State ──────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser]   = useState(null)   // logged in user
  const [posts, setPosts]               = useState([])      // all posts
  const [loading, setLoading]           = useState(true)    // initial load
  const [error, setError]               = useState(null)    // fetch error
  const [showModal, setShowModal]       = useState(false)   // create post modal
  const [expandedPost, setExpandedPost] = useState(null)    // clicked post (full view)

  // ─── Create post form state ──────────────────────────────────────────────
  const [form, setForm] = useState({
    title: '',
    description: '',
    stage: '',
    looking_for: [],
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError]     = useState(null)

  // ─── On mount: get current user then fetch posts ─────────────────────────
  useEffect(() => {
    async function init() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/login')
    return
  }
  setCurrentUser(user)
  await fetchPosts()  // make sure this line exists and is awaited
}
    init()
  }, [])

  // ─── Fetch all posts from our API ────────────────────────────────────────
  async function fetchPosts() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/posts')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load posts')
      setPosts(json.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // ─── Toggle looking_for chip in create form ───────────────────────────────
  function toggleLookingFor(value) {
    setForm(prev => ({
      ...prev,
      looking_for: prev.looking_for.includes(value)
        ? prev.looking_for.filter(v => v !== value)
        : [...prev.looking_for, value]
    }))
  }

  // ─── Submit create post form ──────────────────────────────────────────────
  async function handleCreatePost() {
   
    // Guard: if currentUser not loaded yet, try to get it again
  if (!currentUser) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setFormError('You must be logged in to post.')
      return
    }
    setCurrentUser(user)
    // Small delay to let state update
    await new Promise(r => setTimeout(r, 100))
  }

  // ... rest of the function stays exactly the same

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

      /// Reset form + close modal + refresh feed
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

  // ─── Handle reaction click ────────────────────────────────────────────────
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

      // Optimistically update the posts list in state
      // instead of refetching everything
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post

        const oldReactions = { ...post.reactions }
        const oldUserReaction = post.reactions_by_user?.[currentUser.id]

        // Remove old reaction count if user had one
        if (oldUserReaction) {
          oldReactions[oldUserReaction] = Math.max(0, (oldReactions[oldUserReaction] || 1) - 1)
        }

        // Add new reaction count unless it was a toggle-off
        const newUserReaction = json.data.action === 'removed' ? null : type
        if (newUserReaction) {
          oldReactions[newUserReaction] = (oldReactions[newUserReaction] || 0) + 1
        }

        return {
          ...post,
          reactions: oldReactions,
          reactions_by_user: {
            ...post.reactions_by_user,
            [currentUser.id]: newUserReaction,
          }
        }
      }))
    } catch (err) {
      toast.error('Failed to react. Try again.')
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f1a', color: '#f8fafc' }}>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '680px', margin: '0 auto', padding: '32px 16px' }}>

        {/* Header row with Post Idea button */}
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
    <div>
      <h1 style={{ fontSize: '32px', fontWeight: 500, color: '#f8fafc', letterSpacing: '0.08em' }}>
        Builder Feed
      </h1>
      <p style={{ fontSize: '16px', color: '#94a3b8', marginTop: '4px' }}>
        Ideas, projects, and teams forming in real time.
      </p>
    </div>

    {/* Post Idea button */}
    <button
      onClick={() => setShowModal(true)}
      style={{
        backgroundColor: '#6c63ff',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 20px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'pointer',
        letterSpacing: '0.08em',
        whiteSpace: 'nowrap',
      }}
    >
      + Post Idea
    </button>
  </div>

        {/* ── LOADING STATE ─────────────────────────────────────────────── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
            Loading posts...
          </div>
        )}

        {/* ── ERROR STATE ───────────────────────────────────────────────── */}
        {error && !loading && (
          <div style={{
            backgroundColor: '#2d1b1b',
            border: '1px solid #7f1d1d',
            borderRadius: '12px',
            padding: '16px',
            color: '#fca5a5',
            marginBottom: '24px',
          }}>
            {error}
            <button
              onClick={fetchPosts}
              style={{ marginLeft: '12px', color: '#6c63ff', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── EMPTY STATE ───────────────────────────────────────────────── */}
        {!loading && !error && posts.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 0',
            color: '#94a3b8',
          }}>
            <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛠️</div>
            <p style={{ fontSize: '16px', marginBottom: '8px', color: '#f8fafc' }}>No posts yet.</p>
            <p style={{ fontSize: '14px' }}>Be the first builder to post an idea.</p>
          </div>
        )}

        {/* ── POST CARDS ────────────────────────────────────────────────── */}
        {!loading && posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            currentUserId={currentUser?.id}
            onReact={handleReact}
            onExpand={() => setExpandedPost(post)}
          />
        ))}
      </main>

      {/* ── CREATE POST MODAL ─────────────────────────────────────────────── */}
      {showModal && (
        <Modal onClose={() => { setShowModal(false); setFormError(null) }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, marginBottom: '24px', letterSpacing: '0.08em' }}>
            Share Your Idea
          </h2>

          {/* Title */}
          <label style={labelStyle}>Idea Title *</label>
          <input
            placeholder="e.g. AI study partner for tier-3 colleges"
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            style={inputStyle}
            maxLength={100}
          />

          {/* Description */}
          <label style={labelStyle}>What are you building? *</label>
          <textarea
            placeholder="Describe the problem, your solution, and where you're at..."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
            maxLength={1000}
          />

          {/* Stage */}
          <label style={labelStyle}>Stage *</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
            {STAGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setForm(p => ({ ...p, stage: opt.value }))}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: form.stage === opt.value ? '#6c63ff' : 'transparent',
                  borderColor: form.stage === opt.value ? '#6c63ff' : '#2d3a5e',
                  color: form.stage === opt.value ? '#fff' : '#94a3b8',
                  transition: 'all 0.15s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Looking For */}
          <label style={labelStyle}>Looking For (optional)</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
            {LOOKING_FOR_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => toggleLookingFor(opt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid',
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: form.looking_for.includes(opt) ? '#22d3ee22' : 'transparent',
                  borderColor: form.looking_for.includes(opt) ? '#22d3ee' : '#2d3a5e',
                  color: form.looking_for.includes(opt) ? '#22d3ee' : '#94a3b8',
                  transition: 'all 0.15s',
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Form error */}
          {formError && (
            <p style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
              {formError}
            </p>
          )}

          {/* Submit */}
          <button
            onClick={handleCreatePost}
            disabled={formLoading}
            style={{
              width: '100%',
              backgroundColor: formLoading ? '#4a4580' : '#6c63ff',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '15px',
              fontWeight: 500,
              cursor: formLoading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            {formLoading ? 'Posting...' : 'Post Idea'}
          </button>
        </Modal>
      )}

      {/* ── EXPANDED POST VIEW ────────────────────────────────────────────── */}
      {expandedPost && (
        <ExpandedPost
          post={expandedPost}
          currentUser={currentUser}
          onClose={() => setExpandedPost(null)}
          onReact={handleReact}
          onCommentAdded={(postId) => {
            // Increment comment count in feed without refetching
            setPosts(prev => prev.map(p =>
              p.id === postId
                ? { ...p, comment_count: (p.comment_count || 0) + 1 }
                : p
            ))
          }}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// POST CARD COMPONENT
// ══════════════════════════════════════════════════════════════════════════
function PostCard({ post, currentUserId, onReact, onExpand }) {
  const userReaction = post.reactions_by_user?.[currentUserId]

  const stageColors = {
    idea:       { bg: '#1a1a2e', text: '#a78bfa', border: '#3d2f7f' },
    validation: { bg: '#1a2a1a', text: '#34d399', border: '#1a4a2a' },
    building:   { bg: '#1a2a3a', text: '#22d3ee', border: '#1a3a4a' },
    launched:   { bg: '#2a1a1a', text: '#f97316', border: '#4a2a1a' },
  }
  const stageStyle = stageColors[post.stage] || stageColors.idea

  return (
    <div
      style={{
        backgroundColor: '#16213e',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '16px',
        border: '1px solid #1e2a4a',
        transition: 'border-color 0.15s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#6c63ff55'}
      onMouseLeave={e => e.currentTarget.style.borderColor = '#1e2a4a'}
    >
      {/* Author row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        {/* Avatar */}
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          backgroundColor: '#6c63ff33',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 600, color: '#a78bfa', flexShrink: 0,
        }}>
          {post.users?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 500, color: '#f8fafc', margin: 0 }}>
            {post.users?.name || 'Unknown'}
          </p>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {post.users?.college || 'College not set'} · {timeAgo(post.created_at)}
          </p>
        </div>
        {/* Stage badge */}
        <div style={{
          marginLeft: 'auto',
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 500,
          backgroundColor: stageStyle.bg,
          color: stageStyle.text,
          border: `1px solid ${stageStyle.border}`,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}>
          {post.stage}
        </div>
      </div>

      {/* Title + description */}
      <h3
        onClick={onExpand}
        style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px', color: '#f8fafc', lineHeight: 1.4 }}
      >
        {post.title}
      </h3>
      <p style={{
        fontSize: '14px', color: '#94a3b8', marginBottom: '14px',
        lineHeight: 1.6,
        // Truncate to 3 lines
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}>
        {post.description}
      </p>

      {/* Looking for chips */}
      {post.looking_for?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
          {post.looking_for.map(item => (
            <span key={item} style={{
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              backgroundColor: '#22d3ee11',
              color: '#22d3ee',
              border: '1px solid #22d3ee33',
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Reactions + comment count row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        {REACTIONS.map(r => (
          <button
            key={r.type}
            onClick={(e) => { e.stopPropagation(); onReact(post.id, r.type) }}
            title={r.label}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: '1px solid',
              fontSize: '13px',
              cursor: 'pointer',
              backgroundColor: userReaction === r.type ? '#6c63ff22' : 'transparent',
              borderColor: userReaction === r.type ? '#6c63ff' : '#2d3a5e',
              color: userReaction === r.type ? '#a78bfa' : '#94a3b8',
              transition: 'all 0.15s',
            }}
          >
            {r.emoji}
            <span>{post.reactions?.[r.type] || 0}</span>
          </button>
        ))}

        {/* Comment count — click to expand */}
        <button
          onClick={onExpand}
          style={{
            marginLeft: 'auto',
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '5px 10px',
            borderRadius: '8px',
            border: '1px solid #2d3a5e',
            fontSize: '13px',
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: '#94a3b8',
          }}
        >
          💬 {post.comment_count || 0}
        </button>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// MODAL WRAPPER COMPONENT
// ══════════════════════════════════════════════════════════════════════════
function Modal({ children, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: '#00000088',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200,
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}  // prevent closing when clicking inside
        style={{
          backgroundColor: '#16213e',
          borderRadius: '16px',
          padding: '28px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid #1e2a4a',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// SHARED STYLES
// ══════════════════════════════════════════════════════════════════════════
const labelStyle = {
  display: 'block',
  fontSize: '13px',
  color: '#94a3b8',
  marginBottom: '6px',
  letterSpacing: '0.08em',
}

const inputStyle = {
  width: '100%',
  backgroundColor: '#0f0f1a',
  border: '1px solid #2d3a5e',
  borderRadius: '8px',
  padding: '10px 12px',
  color: '#f8fafc',
  fontSize: '14px',
  marginBottom: '16px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

// ══════════════════════════════════════════════════════════════════════════
// EXPANDED POST COMPONENT — full post with comments
// ══════════════════════════════════════════════════════════════════════════
function ExpandedPost({ post, currentUser, onClose, onReact, onCommentAdded }) {
  const [fullPost, setFullPost]         = useState(null)   // post with comments
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)
  const [comment, setComment]           = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState(null)

  const userReaction = (fullPost || post).reactions_by_user?.[currentUser?.id]

  // Fetch full post with comments when this opens
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

  // Submit a comment
  async function handleComment() {
    if (!comment.trim()) return
    try {
      setCommentLoading(true)
      setCommentError(null)
      const res = await fetch('/api/posts/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          postId: post.id,
          content: comment.trim(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to post comment')

      // Append new comment to local state immediately
      setFullPost(prev => ({
        ...prev,
        comments: [...(prev.comments || []), json.data],
      }))
      setComment('')
      onCommentAdded(post.id)  // update count in feed
      toast.success('Comment posted!')
    } catch (err) {
      setCommentError(err.message)
      toast.error('Failed to post comment.')
    } finally {
      setCommentLoading(false)
    }
  }

  const displayPost = fullPost || post

  return (
    <Modal onClose={onClose}>
      {/* Stage badge + title */}
      <div style={{ marginBottom: '16px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 500, color: '#a78bfa',
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {displayPost.stage}
        </span>
        <h2 style={{ fontSize: '20px', fontWeight: 500, marginTop: '6px', lineHeight: 1.4 }}>
          {displayPost.title}
        </h2>
      </div>

      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          backgroundColor: '#6c63ff33',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 600, color: '#a78bfa',
        }}>
          {displayPost.users?.name?.charAt(0).toUpperCase() || '?'}
        </div>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc', margin: 0 }}>
            {displayPost.users?.name}
          </p>
          <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
            {displayPost.users?.college} · {timeAgo(displayPost.created_at)}
          </p>
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '15px', color: '#cbd5e1', lineHeight: 1.7, marginBottom: '16px' }}>
        {displayPost.description}
      </p>

      {/* Looking for */}
      {displayPost.looking_for?.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {displayPost.looking_for.map(item => (
            <span key={item} style={{
              padding: '4px 12px', borderRadius: '20px', fontSize: '12px',
              backgroundColor: '#22d3ee11', color: '#22d3ee', border: '1px solid #22d3ee33',
            }}>
              {item}
            </span>
          ))}
        </div>
      )}

      {/* Reactions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {REACTIONS.map(r => (
          <button
            key={r.type}
            onClick={() => onReact(displayPost.id, r.type)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '7px 14px', borderRadius: '8px', border: '1px solid',
              fontSize: '14px', cursor: 'pointer',
              backgroundColor: userReaction === r.type ? '#6c63ff22' : 'transparent',
              borderColor: userReaction === r.type ? '#6c63ff' : '#2d3a5e',
              color: userReaction === r.type ? '#a78bfa' : '#94a3b8',
              transition: 'all 0.15s',
            }}
          >
            {r.emoji} {displayPost.reactions?.[r.type] || 0}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #1e2a4a', marginBottom: '20px' }} />

      {/* Comments heading */}
      <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px', letterSpacing: '0.08em' }}>
        COMMENTS {loading ? '' : `· ${fullPost?.comments?.length || 0}`}
      </p>

      {/* Loading comments */}
      {loading && (
        <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
          Loading...
        </p>
      )}

      {/* Error */}
      {error && (
        <p style={{ color: '#fca5a5', fontSize: '14px' }}>{error}</p>
      )}

      {/* Comments list */}
      {!loading && fullPost?.comments?.map(c => (
        <div key={c.id} style={{
          display: 'flex', gap: '10px', marginBottom: '16px',
        }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
            backgroundColor: '#6c63ff22',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '12px', fontWeight: 600, color: '#a78bfa',
          }}>
            {c.users?.name?.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{
            backgroundColor: '#0f0f1a', borderRadius: '8px',
            padding: '10px 14px', flex: 1,
          }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#f8fafc' }}>
                {c.users?.name || 'Unknown'}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                {timeAgo(c.created_at)}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
              {c.content}
            </p>
          </div>
        </div>
      ))}

      {/* Empty comments */}
      {!loading && fullPost?.comments?.length === 0 && (
        <p style={{ color: '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '12px 0' }}>
          No comments yet. Start the conversation.
        </p>
      )}

      {/* Add comment input */}
      <div style={{ marginTop: '20px' }}>
        <textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          style={{ ...inputStyle, height: '80px', resize: 'none', marginBottom: '8px' }}
          maxLength={500}
        />
        {commentError && (
          <p style={{ color: '#fca5a5', fontSize: '13px', marginBottom: '8px' }}>
            {commentError}
          </p>
        )}
        <button
          onClick={handleComment}
          disabled={commentLoading || !comment.trim()}
          style={{
            backgroundColor: commentLoading || !comment.trim() ? '#4a4580' : '#6c63ff',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '10px 20px', fontSize: '14px', fontWeight: 500,
            cursor: commentLoading || !comment.trim() ? 'not-allowed' : 'pointer',
          }}
        >
          {commentLoading ? 'Posting...' : 'Comment'}
        </button>
      </div>
    </Modal>
  )
}