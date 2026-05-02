// PURPOSE: Login page
// - Form: email, password
// - Calls POST /api/auth/login
// - Redirects to /onboarding if not done, else /feed

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed. Check your credentials.')
        setLoading(false)
        return
      }

      // Redirect based on onboarding status
      if (data.data?.onboardingDone === false) {
        router.push('/onboarding')
      } else {
        router.push('/feed')
      }

    } catch (err) {
      setError('Network error. Check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <main
      style={{ backgroundColor: '#0f0f1a', minHeight: '100vh' }}
      className="flex items-center justify-center px-4 py-16"
    >
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <a href="/" className="text-lg font-light" style={{ color: '#a78bfa', letterSpacing: '0.08em' }}>
            clansko
          </a>
          <h1 className="text-2xl font-medium mt-4 mb-2" style={{ color: '#f8fafc' }}>
            Welcome back
          </h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>
            Log in to continue building
          </p>
        </div>

        <div className="p-6 rounded-2xl border border-white/10" style={{ backgroundColor: '#16213e' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                EMAIL
              </label>
              <input
                type="email"
                placeholder="you@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>
                PASSWORD
              </label>
              <input
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e)  => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: '#ff4d4d11', border: '1px solid #ff4d4d44', color: '#ff4d4d' }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: loading ? '#6c63ff88' : '#6c63ff',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>

          </form>
        </div>

        <p className="text-center text-sm mt-5" style={{ color: '#94a3b8' }}>
          New to ClanSko?{' '}
          <a href="/signup" style={{ color: '#a78bfa' }} className="hover:underline">Create account</a>
        </p>

      </div>
    </main>
  )
}