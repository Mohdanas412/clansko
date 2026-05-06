// app/(app)/profile/[id]/page.jsx
// Public profile page — shows any user's profile by their ID
// If viewing your own profile — shows an Edit button
// Route: /profile/[id]

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { UserCardSkeleton } from '@/components/Skeleton'

export default function ProfilePage({ params }) {
  const router = useRouter()
  const { id } = params  // the userId from the URL

  const [profile, setProfile]     = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')

  useEffect(() => {
    async function loadProfile() {
      try {
        // Get logged in user
        const { data: { user } } = await supabase.auth.getUser()
        if (user) setCurrentUser(user)

        // Fetch the profile for the ID in the URL
        const res = await fetch(`/api/users/${id}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'User not found.')
          setLoading(false)
          return
        }

        setProfile(data.data)
        setLoading(false)

      } catch (err) {
        console.error('Profile load error:', err)
        setError('Failed to load profile.')
        setLoading(false)
      }
    }
    loadProfile()
  }, [id])

  // ── Loading state ──
  if (loading) {
    return (
      <main style={{ backgroundColor: '#0f0f1a', minHeight: '100vh', padding: '48px 16px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          {/* Back button skeleton */}
          <div style={{ width: '60px', height: '14px', backgroundColor: '#1e2a4a', borderRadius: '6px', marginBottom: '32px' }} />
          {/* Profile card skeleton — reuse UserCardSkeleton shape */}
          <div style={{
            backgroundColor: '#16213e',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #2a2a4a',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}>
            {/* Avatar + name */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#1e2a4a', flexShrink: 0 }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                <div style={{ width: '160px', height: '20px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
                <div style={{ width: '120px', height: '14px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
              </div>
            </div>
            {/* Divider */}
            <div style={{ height: '1px', backgroundColor: '#2a2a4a' }} />
            {/* Branch + year */}
            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ width: '80px', height: '14px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
              <div style={{ width: '60px', height: '14px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
            </div>
            {/* Bio lines */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ width: '100%', height: '14px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
              <div style={{ width: '85%', height: '14px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
            </div>
            {/* Skills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <div style={{ width: '70px', height: '26px', backgroundColor: '#1e2a4a', borderRadius: '999px' }} />
              <div style={{ width: '90px', height: '26px', backgroundColor: '#1e2a4a', borderRadius: '999px' }} />
              <div style={{ width: '60px', height: '26px', backgroundColor: '#1e2a4a', borderRadius: '999px' }} />
            </div>
          </div>
        </div>
      </main>
    )
  }

  // ── Error state ──
  if (error) {
    return (
      <main style={{ backgroundColor: '#0f0f1a', minHeight: '100vh' }}
        className="flex items-center justify-center">
        <div className="text-center">
          <p style={{ color: '#ff4d4d' }} className="text-sm mb-4">{error}</p>
          <button
            onClick={() => router.push('/feed')}
            style={{ color: '#a78bfa' }}
            className="text-sm hover:underline"
          >
            ← Back to feed
          </button>
        </div>
      </main>
    )
  }

  const isOwnProfile = currentUser?.id === profile?.id

  return (
    <main style={{ backgroundColor: '#0f0f1a', minHeight: '100vh', padding: '24px 16px' }}>
      <div className="max-w-xl mx-auto">

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="text-sm mb-8 hover:underline"
          style={{ color: '#94a3b8' }}
        >
          ← Back
        </button>

        {/* Profile card */}
        <div className="p-6 rounded-2xl border border-white/10" style={{ backgroundColor: '#16213e' }}>

          {/* Top row — avatar + name + edit button */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">

              {/* Avatar — initials based */}
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-medium"
                style={{ backgroundColor: '#6c63ff22', border: '2px solid #6c63ff', color: '#a78bfa' }}
              >
                {profile.name?.charAt(0).toUpperCase()}
              </div>

              <div>
                <h1 className="text-xl font-medium" style={{ color: '#f8fafc' }}>
                  {profile.name}
                </h1>
                <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                  {profile.college || 'College not set'}
                </p>
              </div>
            </div>

            {/* Edit button — only on own profile */}
            {isOwnProfile && (
              <button
                onClick={() => router.push('/onboarding')}
                className="px-4 py-2 rounded-lg text-xs font-medium"
                style={{ backgroundColor: 'transparent', border: '1px solid #6c63ff', color: '#a78bfa', cursor: 'pointer' }}
              >
                Edit profile
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="w-full h-px mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }} />

          {/* College info row */}
          <div className="flex gap-6 mb-6 flex-wrap">
            {profile.branch && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>BRANCH</p>
                <p className="text-sm font-medium" style={{ color: '#f8fafc' }}>{profile.branch}</p>
              </div>
            )}
            {profile.year && (
              <div>
                <p className="text-xs mb-1" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>YEAR</p>
                <p className="text-sm font-medium" style={{ color: '#f8fafc' }}>Year {profile.year}</p>
              </div>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-6">
              <p className="text-xs mb-2" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>BIO</p>
              <p className="text-sm leading-relaxed" style={{ color: '#f8fafc' }}>{profile.bio}</p>
            </div>
          )}

          {/* Skills */}
          {profile.skills && profile.skills.length > 0 && (
            <div className="mb-6">
              <p className="text-xs mb-3" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>SKILLS</p>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#6c63ff22', border: '1px solid #6c63ff44', color: '#a78bfa' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Looking for */}
          {profile.looking_for && profile.looking_for.length > 0 && (
            <div>
              <p className="text-xs mb-3" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>LOOKING FOR</p>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(profile.looking_for) ? profile.looking_for : [profile.looking_for]).map(item => (
                  <span
                    key={item}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#22d3ee11', border: '1px solid #22d3ee44', color: '#22d3ee' }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Connect button — only show on other people's profiles */}
        {!isOwnProfile && (
          <div className="mt-4">
            <button
              className="w-full py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: '#6c63ff', color: '#fff', cursor: 'pointer' }}
            >
              Connect →
            </button>
          </div>
        )}

      </div>
    </main>
  )
}