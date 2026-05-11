'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const res = await fetch('/api/posts')
      const json = await res.json()
      const myPosts = (json.data || []).filter(p => p.user_id === user.id)
      setPosts(myPosts)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 16px', minHeight: '100vh' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 28, height: 3, background: '#F97316', borderRadius: 2 }} />
          <span style={{ fontSize: 12, color: '#F97316', letterSpacing: '0.1em', fontWeight: 500, textTransform: 'uppercase' }}>
            My Projects
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 32px)', fontWeight: 600, color: '#F5F0E8', letterSpacing: '-0.01em' }}>
          Your ideas & teams
        </h1>
        <p style={{ fontSize: 14, color: '#6A6A5A', marginTop: 4 }}>
          Manage your posted ideas and the teams forming around them.
        </p>
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 100, background: '#161616', borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '64px 0',
          border: '1px dashed #2A2A2A', borderRadius: 12,
        }}>
          <p style={{ fontSize: 16, color: '#F5F0E8', marginBottom: 8, fontWeight: 500 }}>
            No ideas posted yet.
          </p>
          <p style={{ fontSize: 14, color: '#6A6A5A', marginBottom: 24 }}>
            Post your first idea on the feed to start building a team.
          </p>
          <button
            onClick={() => router.push('/feed')}
            style={{
              background: '#F97316', color: '#111', border: 'none',
              borderRadius: 6, padding: '10px 20px', fontWeight: 600,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Go to Feed →
          </button>
        </div>
      )}

      {!loading && posts.map(post => (
        <div
          key={post.id}
          onClick={() => router.push(`/projects/${post.id}`)}
          style={{
            background: '#161616', border: '1px solid #1E1E1E',
            borderRadius: 12, padding: '20px 24px', marginBottom: 12,
            cursor: 'pointer', transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#2A2A2A'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#1E1E1E'}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <span style={{
                fontSize: 11, color: '#F97316', background: '#F9731610',
                border: '1px solid #F9731630', borderRadius: 20,
                padding: '2px 10px', fontWeight: 500, marginBottom: 10,
                display: 'inline-block',
              }}>
                {post.stage || 'idea'}
              </span>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F5F0E8', margin: '8px 0 6px', lineHeight: 1.4 }}>
                {post.title}
              </h3>
              <p style={{ fontSize: 13, color: '#6A6A5A', lineHeight: 1.6, margin: 0,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {post.description}
              </p>
            </div>
            <span style={{
              color: '#F97316', fontSize: 13, fontWeight: 600,
              whiteSpace: 'nowrap', paddingTop: 4,
            }}>
              Manage →
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}