// app/(auth)/signup/page.jsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError('')
    try {
      // Step 1 — create account in Supabase Auth + insert into users table
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Try again.')
        setLoading(false)
        return
      }

      // Step 2 — sign in on client side so browser session is set
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError('Account created but login failed. Please log in manually.')
        setLoading(false)
        return
      }

      // Step 3 — go to onboarding
      router.push('/onboarding')

    } catch (err) {
      setError('Network error. Check your connection and try again.')
      setLoading(false)
    }
  }

  return (
    <main style={{ backgroundColor: '#0f0f1a', minHeight: '100vh' }}
      className="flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <a href="/" className="text-lg font-light" style={{ color: '#a78bfa', letterSpacing: '0.08em' }}>clansko</a>
          <h1 className="text-2xl font-medium mt-4 mb-2" style={{ color: '#f8fafc' }}>Create your account</h1>
          <p className="text-sm" style={{ color: '#94a3b8' }}>Join the community of serious builder students</p>
        </div>
        <div className="p-6 rounded-2xl border border-white/10" style={{ backgroundColor: '#16213e' }}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>FULL NAME</label>
              <input type="text" placeholder="Your name" value={name}
                onChange={(e) => setName(e.target.value)} disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>EMAIL</label>
              <input type="email" placeholder="you@college.edu" value={email}
                onChange={(e) => setEmail(e.target.value)} disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: '#94a3b8', letterSpacing: '0.08em' }}>PASSWORD</label>
              <input type="password" placeholder="Min 6 characters" value={password}
                onChange={(e) => setPassword(e.target.value)} disabled={loading}
                className="w-full px-4 py-3 rounded-lg text-sm outline-none"
                style={{ backgroundColor: '#0f0f1a', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc' }}
                onFocus={(e) => e.target.style.borderColor = '#6c63ff'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
            </div>
            {error && (
              <div className="px-4 py-3 rounded-lg text-sm"
                style={{ backgroundColor: '#ff4d4d11', border: '1px solid #ff4d4d44', color: '#ff4d4d' }}>
                {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-medium"
              style={{ backgroundColor: loading ? '#6c63ff88' : '#6c63ff', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
        <p className="text-center text-sm mt-5" style={{ color: '#94a3b8' }}>
          Already on ClanSko?{' '}
          <a href="/login" style={{ color: '#a78bfa' }} className="hover:underline">Log in</a>
        </p>
      </div>
    </main>
  )
}