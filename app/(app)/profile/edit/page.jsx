// app/(app)/profile/edit/page.jsx
// Edit profile page — pre-fills current data, saves via api/users/update
// Route: /profile/edit

'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import toast from 'react-hot-toast'

const BRANCHES = [
  'Computer Science', 'Information Technology', 'Electronics & Communication',
  'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering',
  'Chemical Engineering', 'Biotechnology', 'Other'
]

const SKILL_OPTIONS = [
  'React', 'Next.js', 'Node.js', 'Python', 'Django', 'Flutter',
  'React Native', 'UI/UX Design', 'Figma', 'Machine Learning',
  'Data Science', 'DevOps', 'AWS', 'Firebase', 'MongoDB',
  'PostgreSQL', 'Java', 'C++', 'Marketing', 'Sales', 'No-code'
]

const LOOKING_FOR_OPTIONS = [
  'Co-founder', 'Technical Partner', 'Designer', 'Marketing Partner',
  'Accountability Partner', 'Just exploring', 'Mentor'
]

export default function EditProfilePage() {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  // ── State ──
  const [userId, setUserId]       = useState(null)
  const [college, setCollege]     = useState('')
  const [branch, setBranch]       = useState('')
  const [year, setYear]           = useState('')
  const [bio, setBio]             = useState('')
  const [skills, setSkills]       = useState([])
  const [lookingFor, setLookingFor] = useState('')
  const [loading, setLoading]     = useState(true)  // loading current data
  const [saving, setSaving]       = useState(false)  // saving changes
  const [error, setError]         = useState('')

  // ── Load current profile data on mount ──
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push('/login'); return }

        setUserId(user.id)

        // Fetch current profile data to pre-fill the form
        const res = await fetch(`/api/users/${user.id}`)
        const json = await res.json()

        if (!res.ok) {
          setError('Failed to load profile.')
          setLoading(false)
          return
        }

        const p = json.data
        setCollege(p.college || '')
        setBranch(p.branch || '')
        setYear(p.year ? String(p.year) : '')
        setBio(p.bio || '')
        setSkills(Array.isArray(p.skills) ? p.skills : [])
        // looking_for is stored as array — take first item for single select
        setLookingFor(
          Array.isArray(p.looking_for) && p.looking_for.length > 0
            ? p.looking_for[0]
            : ''
        )
        setLoading(false)

      } catch (err) {
        setError('Something went wrong.')
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  function toggleSkill(skill) {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  async function handleSave() {
    setError('')

    // Validation
    if (!college.trim()) return setError('College name is required.')
    if (!branch)         return setError('Please select your branch.')
    if (!year)           return setError('Please select your year.')
    if (!bio.trim())     return setError('Please write a short bio.')
    if (skills.length === 0) return setError('Select at least one skill.')
    if (!lookingFor)     return setError('Please select what you are looking for.')

    setSaving(true)
    try {
      const res = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          college: college.trim(),
          branch,
          year: parseInt(year),
          bio: bio.trim(),
          skills,
          looking_for: [lookingFor],  // always send as array
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        setError(json.error || 'Failed to save. Try again.')
        setSaving(false)
        return
      }

      toast.success('Profile updated!')
      // Use window.location to force a full page reload
      // router.push serves cached data — window.location forces fresh fetch
      window.location.href = `/profile/${userId}`

    } catch (err) {
      setError('Network error. Try again.')
      setSaving(false)
    }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <main style={{ backgroundColor: '#0f0f1a', minHeight: '100vh', padding: '24px 16px' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <div style={{ width: '60px', height: '14px', backgroundColor: '#1e2a4a', borderRadius: '6px', marginBottom: '32px' }} />
          <div style={{ backgroundColor: '#16213e', borderRadius: '16px', padding: '24px', border: '1px solid #2a2a4a', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[200, 160, 120, 240, 180].map((w, i) => (
              <div key={i} style={{ width: `${w}px`, height: '16px', backgroundColor: '#1e2a4a', borderRadius: '6px' }} />
            ))}
          </div>
        </div>
      </main>
    )
  }

  // ── Main render ──
  return (
    <main style={{ backgroundColor: '#0f0f1a', minHeight: '100vh', padding: '24px 16px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>

        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            background: 'transparent', border: 'none',
            color: '#94a3b8', fontSize: '14px',
            cursor: 'pointer', marginBottom: '24px',
            padding: 0, letterSpacing: '0.05em',
          }}
        >
          ← Back
        </button>

        <h1 style={{
          fontSize: '22px', fontWeight: 500,
          color: '#f8fafc', marginBottom: '24px',
          letterSpacing: '0.08em',
        }}>
          Edit Profile
        </h1>

        {/* ── Form card ── */}
        <div style={{
          backgroundColor: '#16213e',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #2a2a4a',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>

          {/* College */}
          <div>
            <label style={labelStyle}>COLLEGE NAME</label>
            <input
              type="text"
              value={college}
              onChange={e => setCollege(e.target.value)}
              placeholder="e.g. VIT Vellore, NIT Trichy..."
              style={inputStyle}
            />
          </div>

          {/* Branch */}
          <div>
            <label style={labelStyle}>BRANCH</label>
            <select
              value={branch}
              onChange={e => setBranch(e.target.value)}
              style={{ ...inputStyle, color: branch ? '#f8fafc' : '#94a3b8' }}
            >
              <option value="">Select branch</option>
              {BRANCHES.map(b => (
                <option key={b} value={b} style={{ backgroundColor: '#16213e' }}>{b}</option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div>
            <label style={labelStyle}>YEAR</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              style={{ ...inputStyle, color: year ? '#f8fafc' : '#94a3b8' }}
            >
              <option value="">Select year</option>
              {[1, 2, 3, 4].map(y => (
                <option key={y} value={y} style={{ backgroundColor: '#16213e' }}>Year {y}</option>
              ))}
            </select>
          </div>

          {/* Bio */}
          <div>
            <label style={labelStyle}>BIO <span style={{ color: '#6c63ff' }}>(max 200 chars)</span></label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, 200))}
              placeholder="Tell builders who you are..."
              rows={3}
              style={{ ...inputStyle, resize: 'none' }}
            />
            <p style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right', marginTop: '-8px' }}>
              {bio.length}/200
            </p>
          </div>

          {/* Skills */}
          <div>
            <label style={labelStyle}>SKILLS</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {SKILL_OPTIONS.map(skill => {
                const selected = skills.includes(skill)
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '999px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      backgroundColor: selected ? '#6c63ff' : 'transparent',
                      border: `1px solid ${selected ? '#6c63ff' : 'rgba(255,255,255,0.15)'}`,
                      color: selected ? '#fff' : '#94a3b8',
                      transition: 'all 0.15s',
                    }}
                  >
                    {skill}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Looking for */}
          <div>
            <label style={labelStyle}>LOOKING FOR</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {LOOKING_FOR_OPTIONS.map(option => {
                const selected = lookingFor === option
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLookingFor(option)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      backgroundColor: selected ? '#6c63ff22' : 'transparent',
                      border: `1px solid ${selected ? '#6c63ff' : 'rgba(255,255,255,0.1)'}`,
                      color: selected ? '#a78bfa' : '#94a3b8',
                      transition: 'all 0.15s',
                    }}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              backgroundColor: '#ff4d4d11',
              border: '1px solid #ff4d4d44',
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#ff4d4d',
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              backgroundColor: saving ? '#4a4580' : '#6c63ff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 500,
              cursor: saving ? 'not-allowed' : 'pointer',
              letterSpacing: '0.08em',
              transition: 'background-color 0.2s',
            }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

        </div>
      </div>
    </main>
  )
}

// ── Shared styles ──
const labelStyle = {
  display: 'block',
  fontSize: '12px',
  color: '#94a3b8',
  letterSpacing: '0.08em',
  marginBottom: '8px',
  fontWeight: 500,
}

const inputStyle = {
  width: '100%',
  backgroundColor: '#0f0f1a',
  border: '1px solid #2a2a4a',
  borderRadius: '8px',
  padding: '10px 14px',
  color: '#f8fafc',
  fontSize: '14px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'Inter, sans-serif',
}