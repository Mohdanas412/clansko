// app/(app)/layout.jsx
// App shell — sticky top nav for desktop, bottom tab bar for mobile

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Toaster } from 'react-hot-toast'

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

  function navLinkStyle(href) {
    const isActive = pathname === href
    return {
      color: isActive ? '#6c63ff' : '#94a3b8',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: isActive ? 500 : 400,
      letterSpacing: '0.08em',
      transition: 'color 0.2s',
      whiteSpace: 'nowrap',
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f0f1a' }}>

      {/* ── GLOBAL RESPONSIVE STYLES ── */}
      <style>{`
        @media (min-width: 640px) {
          .mobile-nav { display: none !important; }
          .mobile-logout { display: none !important; }
          .desktop-nav { display: flex !important; }
          .main-content { padding-bottom: 0 !important; }
        }
        @media (max-width: 639px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { padding-bottom: 60px !important; }
        }
      `}</style>

      {/* ── TOP NAV — desktop only ── */}
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
        {/* Logo — always visible */}
        <Link href="/feed" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <span style={{
            fontSize: '18px',
            fontWeight: 500,
            color: '#6c63ff',
            letterSpacing: '0.08em',
          }}>
            ClanSko
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="desktop-nav" style={{
          gap: '28px',
          alignItems: 'center',
        }}>
          <Link href="/feed" style={navLinkStyle('/feed')}>Feed</Link>
          <Link href="/explore" style={navLinkStyle('/explore')}>Explore</Link>
          <Link href="/messages" style={navLinkStyle('/messages')}>Messages</Link>
          <Link href="/goals" style={navLinkStyle('/goals')}>Goals</Link>
          <Link href="/profile" style={navLinkStyle('/profile')}>Profile</Link>
          <button onClick={handleLogout} style={{
            backgroundColor: 'transparent',
            border: '1px solid #2a2a4a',
            borderRadius: '8px',
            padding: '5px 14px',
            color: '#94a3b8',
            fontSize: '13px',
            cursor: 'pointer',
            letterSpacing: '0.08em',
          }}>
            Logout
          </button>
        </div>
      </nav>

      {/* ── BOTTOM TAB BAR — mobile only ── */}
      <nav className="mobile-nav" style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: '#16213e',
        borderTop: '1px solid #2a2a4a',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
      }}>
        {[
          { href: '/feed',     icon: '🏠', label: 'Feed' },
          { href: '/explore',  icon: '🔍', label: 'Explore' },
          { href: '/messages', icon: '💬', label: 'Chat' },
          { href: '/goals',    icon: '🎯', label: 'Goals' },
          { href: '/profile',  icon: '👤', label: 'Profile' },
        ].map(tab => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                textDecoration: 'none',
                flex: 1,
                padding: '6px 0',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>{tab.icon}</span>
              <span style={{
                fontSize: '10px',
                color: isActive ? '#6c63ff' : '#94a3b8',
                fontWeight: isActive ? 500 : 400,
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}

        {/* Logout inside tab bar on mobile */}
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            flex: 1,
            padding: '6px 0',
          }}
        >
          <span style={{ fontSize: '18px', lineHeight: 1 }}>🚪</span>
          <span style={{ fontSize: '10px', color: '#94a3b8' }}>Logout</span>
        </button>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="main-content">
        {children}
      </main>

      {/* ── TOAST NOTIFICATIONS ── */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#16213e',
            color: '#f8fafc',
            border: '1px solid #2a2a4a',
            borderRadius: '8px',
            fontSize: '14px',
            letterSpacing: '0.05em',
            marginBottom: '70px', // push above mobile tab bar
          },
          success: {
            iconTheme: { primary: '#6c63ff', secondary: '#f8fafc' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#f8fafc' },
          },
        }}
      />

    </div>
  )
}