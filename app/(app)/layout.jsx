// app/(app)/layout.jsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import SkoButton from '@/components/SkoButton'

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
      color: isActive ? '#F97316' : '#9A9A8A',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: isActive ? 500 : 400,
      letterSpacing: '0.04em',
      transition: 'color 0.2s',
      whiteSpace: 'nowrap',
      fontFamily: "'DM Sans', sans-serif",
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#111111', fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
        @media (min-width: 640px) {
          .mobile-nav { display: none !important; }
          .desktop-nav { display: flex !important; }
          .main-content { padding-bottom: 0 !important; }
        }
        @media (max-width: 639px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
          .main-content { padding-bottom: 64px !important; }
        }
        .nav-logout-btn:hover { color: #F5F0E8 !important; }
        .mobile-tab:hover span { color: #F5F0E8 !important; }
      `}</style>

      {/* ── TOP NAV — desktop ── */}
      <nav style={{
        backgroundColor: '#111111',
        borderBottom: '1px solid #1A1A1A',
        padding: '0 32px',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        {/* Logo */}
        <Link href="/feed" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{
            width: '24px', height: '24px',
            background: '#F97316',
            borderRadius: '5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#111' }}>C</span>
          </div>
          <span style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#F5F0E8',
            letterSpacing: '0.02em',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            ClanSko
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="desktop-nav" style={{ gap: '32px', alignItems: 'center' }}>
          <Link href="/feed" style={navLinkStyle('/feed')}>Feed</Link>
          <Link href="/explore" style={navLinkStyle('/explore')}>Explore</Link>
          <Link href="/messages" style={navLinkStyle('/messages')}>Messages</Link>
          <Link href="/goals" style={navLinkStyle('/goals')}>Goals</Link>
          <Link href="/profile" style={navLinkStyle('/profile')}>Profile</Link>
          <button onClick={handleLogout} className="nav-logout-btn" style={{
            backgroundColor: 'transparent',
            border: '1px solid #222',
            borderRadius: '6px',
            padding: '6px 14px',
            color: '#9A9A8A',
            fontSize: '13px',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            fontFamily: "'DM Sans', sans-serif",
            transition: 'color 0.2s',
          }}>
            Logout
          </button>
        </div>
      </nav>

      {/* ── BOTTOM TAB BAR — mobile ── */}
      <nav className="mobile-nav" style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        height: '60px',
        backgroundColor: '#161616',
        borderTop: '1px solid #1A1A1A',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
      }}>
        {[
          { href: '/feed', label: 'Feed' },
          { href: '/explore', label: 'Explore' },
          { href: '/messages', label: 'Chat' },
          { href: '/goals', label: 'Goals' },
          { href: '/profile', label: 'Profile' },
        ].map(tab => {
          const isActive = pathname === tab.href
          return (
            <Link key={tab.href} href={tab.href} className="mobile-tab" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              textDecoration: 'none',
              flex: 1,
              padding: '6px 0',
            }}>
              {isActive && (
                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#F97316', marginBottom: '2px' }} />
              )}
              <span style={{
                fontSize: '11px',
                color: isActive ? '#F97316' : '#6A6A5A',
                fontWeight: isActive ? 500 : 400,
                letterSpacing: '0.05em',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {tab.label}
              </span>
            </Link>
          )
        })}
        <button onClick={handleLogout} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '2px', background: 'transparent', border: 'none',
          cursor: 'pointer', flex: 1, padding: '6px 0',
        }}>
          <span style={{ fontSize: '11px', color: '#6A6A5A', fontFamily: "'DM Sans', sans-serif" }}>Logout</span>
        </button>
      </nav>

      {/* ── PAGE CONTENT ── */}
      <main className="main-content">{children}</main>

      {/* ── TOASTER ── */}
      <Toaster
        position="bottom-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A1A1A',
            color: '#F5F0E8',
            border: '1px solid #2A2A2A',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '70px',
          },
          success: { iconTheme: { primary: '#F97316', secondary: '#111' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#111' } },
        }}
      />

      {/* ── SKO ── */}
      <SkoButton />

    </div>
  )
}