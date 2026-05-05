// app/(app)/onboarding/page.jsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

export default function OnboardingPage() {
  const router = useRouter()

  const [step, setStep]           = useState(1)
  const [userId, setUserId]       = useState(null)
  const [college, setCollege]     = useState('')
  const [branch, setBranch]       = useState('')
  const [year, setYear]           = useState('')
  const [bio, setBio]             = useState('')
  const [skills, setSkills]       = useState([])
  const [lookingFor, setLookingFor] = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    async function getUser() {
      try {
        // Try getUser first — most reliable
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          // Fallback to getSession
          const { data: { session } } = await supabase.auth.getSession()
          if (!session) {
            router.push('/login')
            return
          }
          // Use session user if getUser failed
          const sessionUserId = session.user.id
          
          // Check onboarding status
          const { data: profile } = await supabase
            .from('users')
            .select('onboarding_done')
            .eq('id', sessionUserId)
            .single()

          if (profile?.onboarding_done) {
            router.push('/feed')
            return
          }

          ('userId from session:', sessionUserId)
          setUserId(sessionUserId)
          setPageLoading(false)
          return
        }

        ('userId from getUser:', user.id)

        // Check if onboarding already done
        const { data: profile } = await supabase
          .from('users')
          .select('onboarding_done')
          .eq('id', user.id)
          .single()

        if (profile?.onboarding_done) {
          router.push('/feed')
          return
        }

        setUserId(user.id)
        setPageLoading(false)

      } catch (err) {
        console.error('getUser error:', err)
        router.push('/login')
      }
    }
    getUser()
  }, [])

  function toggleSkill(skill) {
    setSkills(prev =>
      prev.includes(skill)
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    )
  }

  function handleNext() {
    setError('')
    if (step === 1) {
      if (!college.trim()) return setError('Please enter your college name.')
      if (!branch)         return setError('Please select your branch.')
      if (!year)           return setError('Please select your year.')
    }
    if (step === 2) {
      if (!bio.trim())         return setError('Please write a short bio.')
      if (skills.length === 0) return setError('Select at least one skill.')
    }
    setStep(prev => prev + 1)
  }

  async function handleSubmit() {
    setError('')
    if (!lookingFor) return setError('Please select what you are looking for.')

    // Final check — get userId fresh from session if state is null
    let finalUserId = userId
    if (!finalUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return setError('Session expired. Please log in again.')
        finalUserId = session.user.id
      } else {
        finalUserId = user.id
      }
    }

    ('Submitting with userId:', finalUserId)
    setLoading(true)

    try {
      const res = await fetch('/api/users/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: finalUserId,
          college,
          branch,
          year: parseInt(year),
          bio,
          skills,
          looking_for: [lookingFor],
          onboarding_done: true,
        }),
      })

      const data = await res.json()
      ('Update response:', data)

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        setLoading(false)
        return
      }

      router.push('/feed')

    } catch (err) {
      console.error('Submit error:', err)
      setError('Network error. Check your connection.')
      setLoading(false)
    }
  }

  // Show loading spinner while checking session
  if (pageLoading) {
    return (
      <main style={{ backgroundColor: '#0f0f1a', minHeight: '100vh' }}
        className="flex items-center justify-center">
        <p style={{ color: '#94a3b8' }} className="text-sm">Loading...</p>
      </main>
    )
  }

  return (
    <main
      style={{ backgroundColor: '#0f0f1a', minHeight: '100vh' }}
      className="flex items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-lg font-light" style={{ color: '#a78bfa', letterSpacing: '0.08em' }}>
            clansko
          </p>
          <h1 className="text-2xl font-medium mt-3 mb-1" style={{ color: '#f8fafc' }}>
            Set up your profile
          </h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Step {step} of 3
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 rounded-full mb-8" style={{ backgroundColor: '#16213e' }}>
          <div
            className="h-1 rounded-full transition-all duration-300"
            style={{ backgroundColor: '#6c63ff', width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Card */}
        <div className="p-6 rounded-2xl border border-white/10" style={{ backgroundColor: '#16213e' }}>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-medium" style={{ color: '#f8fafc' }}>
                Where do you study?
              </h2>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                  COLLEGE NAME
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIT Vellore, NIT Trichy..."
                  value={college}
                  onChange={e => setCollege(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                  BRANCH
                </label>
                <select
                  value={branch}
                  onChange={e => setBranch(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: branch ? '#f8fafc' : '#94a3b8' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  <option value="">Select branch</option>
                  {BRANCHES.map(b => (
                    <option key={b} value={b} style={{ backgroundColor: '#16213e' }}>{b}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                  YEAR
                </label>
                <select
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                  style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: year ? '#f8fafc' : '#94a3b8' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                >
                  <option value="">Select year</option>
                  {[1, 2, 3, 4].map(y => (
                    <option key={y} value={y} style={{ backgroundColor: '#16213e' }}>Year {y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-medium" style={{ color: '#f8fafc' }}>
                Tell us about yourself
              </h2>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                  BIO <span style={{ color: '#6c63ff' }}>(max 200 chars)</span>
                </label>
                <textarea
                  placeholder="e.g. Building a marketplace for college students. Interested in fintech and edtech."
                  value={bio}
                  onChange={e => setBio(e.target.value.slice(0, 200))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
                  style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <p className="text-xs text-right" style={{ color: '#94a3b8' }}>{bio.length}/200</p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                  YOUR SKILLS <span style={{ color: '#6c63ff' }}>(pick all that apply)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => {
                    const selected = skills.includes(skill)
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                        style={{
                          backgroundColor: selected ? '#6c63ff' : 'transparent',
                          border: `1px solid ${selected ? '#6c63ff' : 'rgba(255,255,255,0.15)'}`,
                          color: selected ? '#fff' : '#94a3b8',
                          cursor: 'pointer',
                        }}
                      >
                        {skill}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-lg font-medium" style={{ color: '#f8fafc' }}>
                What are you looking for?
              </h2>
              <p className="text-sm" style={{ color: '#94a3b8' }}>
                This helps others know how to connect with you.
              </p>

              <div className="flex flex-col gap-2">
                {LOOKING_FOR_OPTIONS.map(option => {
                  const selected = lookingFor === option
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLookingFor(option)}
                      className="w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition-all"
                      style={{
                        backgroundColor: selected ? '#6c63ff22' : 'transparent',
                        border: `1px solid ${selected ? '#6c63ff' : 'rgba(255,255,255,0.1)'}`,
                        color: selected ? '#a78bfa' : '#94a3b8',
                        cursor: 'pointer',
                      }}
                    >
                      {option}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg text-sm"
              style={{ backgroundColor: '#ff4d4d11', border: '1px solid #ff4d4d44', color: '#ff4d4d' }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <button
                type="button"
                onClick={() => { setStep(prev => prev - 1); setError('') }}
                disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer' }}
              >
                Back
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{ backgroundColor: '#6c63ff', color: '#fff', cursor: 'pointer' }}
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: loading ? '#6c63ff88' : '#6c63ff',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : 'Finish setup →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}