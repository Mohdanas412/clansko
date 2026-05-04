// app/(app)/layout.jsx
// Shared layout for all app pages — feed, explore, messages, profile
// Any component placed here appears on every (app) page automatically

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function AppLayout({ children }) {
  const pathname = usePathname()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Helper — highlights the active nav link
  function navStyle(href) {
    const isActive = pathname === href
    return {
      color: isActive ? '#6c63ff' : '#94a3b8',
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: isActive ? 500 : 400,
      letterSpacing: '0.08em',
      transition: 'color 0.2s',
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f1a' }}>

      {/* ── Top navbar ── */}
      <nav style={{
        backgroundColor: '#16213e',
        borderBottom: '1px solid #2a2a4a',
        padding: '0 24px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>

        {/* Left: brand */}
        <Link href="/feed" style={{ textDecoration: 'none' }}>
          <span style={{
            fontSize: '20px',
            fontWeight: 500,
            color: '#6c63ff',
            letterSpacing: '0.08em',
          }}>
            ClanSko
          </span>
        </Link>

        {/* Center: nav links */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <Link href="/feed" style={navStyle('/feed')}>Feed</Link>
          <Link href="/explore" style={navStyle('/explore')}>Explore</Link>
          <Link href="/messages" style={navStyle('/messages')}>Messages</Link>
        </div>

        {/* Right: profile + logout */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Link href="/profile" style={navStyle('/profile')}>Profile</Link>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #2a2a4a',
              borderRadius: '8px',
              padding: '6px 14px',
              color: '#94a3b8',
              fontSize: '14px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            Logout
          </button>
        </div>

      </nav>

      {/* ── Page content ── */}
      <main>
        {children}
      </main>

    </div>
  )
}