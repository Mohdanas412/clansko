// app/page.jsx
// ClanSko Landing Page — Warm Dark + Orange Energy
// Redesigned: editorial, bold, community-forward

import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{
      backgroundColor: '#111111',
      minHeight: '100vh',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      color: '#F5F0E8',
      overflowX: 'hidden',
    }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid #1A1A1A',
        position: 'sticky',
        top: 0,
        backgroundColor: '#111111',
        zIndex: 100,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px', height: '28px',
            background: '#F97316',
            borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: '#111', fontFamily: 'DM Sans' }}>C</span>
          </div>
          <span style={{
            fontSize: '17px',
            fontWeight: 600,
            color: '#F5F0E8',
            letterSpacing: '0.02em',
            fontFamily: 'DM Sans',
          }}>
            ClanSko
          </span>
        </div>

        {/* Nav links — hidden on mobile */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#why" className="nav-link">Why ClanSko</a>
          <a href="#features" className="nav-link">Features</a>
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Link href="/login" className="btn-ghost" style={{ padding: '9px 20px', fontSize: '14px' }}>
            Log in
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '9px 20px', fontSize: '14px' }}>
            Join free →
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        padding: '80px 40px 100px',
        maxWidth: '1100px',
        margin: '0 auto',
      }}>
        {/* Badge */}
        <div style={{ marginBottom: '32px' }}>
          <span className="tag">
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
            For Engineering Students in India
          </span>
        </div>

        {/* Headline */}
        <h1 className="hero-title" style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '72px',
          fontWeight: 400,
          lineHeight: 1.05,
          letterSpacing: '-0.02em',
          color: '#F5F0E8',
          maxWidth: '800px',
          marginBottom: '24px',
        }}>
          Stop building alone.<br />
          <span style={{ color: '#F97316', fontStyle: 'italic' }}>Find your people.</span>
        </h1>

        {/* Subheadline */}
        <p style={{
          fontSize: '18px',
          color: '#9A9A8A',
          lineHeight: 1.7,
          maxWidth: '520px',
          marginBottom: '40px',
          fontWeight: 300,
        }}>
          ClanSko is where serious engineering students find co-founders, share startup ideas, and hold each other accountable — week after week.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" className="btn-primary">
            Join the community — it&apos;s free
          </Link>
          <Link href="/login" className="btn-ghost">
            Already a member? Log in
          </Link>
        </div>

        {/* Social proof */}
        <p style={{
          fontSize: '13px',
          color: '#555',
          marginTop: '24px',
          letterSpacing: '0.04em',
        }}>
          No credit card. No BS. Just builders.
        </p>

        {/* Hero visual — stats strip */}
        <div style={{
          marginTop: '72px',
          padding: '32px 40px',
          background: '#161616',
          borderRadius: '16px',
          border: '1px solid #1E1E1E',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0',
        }} className="stats-grid">
          {[
            { num: '1 in 20', label: 'Engineering students actually want to build' },
            { num: '0 ₹', label: 'Cost to join and start connecting' },
            { num: '3', label: 'Goals per week. One week at a time.' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '16px 24px',
              borderRight: i < 2 ? '1px solid #1E1E1E' : 'none',
            }}>
              <div className="stat-number" style={{ fontSize: '36px' }}>{stat.num}</div>
              <p style={{ fontSize: '13px', color: '#6A6A5A', marginTop: '8px', lineHeight: 1.5 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEM SECTION ── */}
      <section id="why" style={{
        padding: '80px 40px',
        borderTop: '1px solid #1A1A1A',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ marginBottom: '56px' }}>
            <div className="divider" style={{ marginBottom: '20px' }} />
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '40px',
              fontWeight: 400,
              color: '#F5F0E8',
              marginBottom: '12px',
            }}>
              You know this feeling.
            </h2>
            <p style={{ fontSize: '16px', color: '#6A6A5A', maxWidth: '480px', lineHeight: 1.7 }}>
              Every serious builder-minded student in India has felt this at some point.
            </p>
          </div>

          {/* Problem cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
          }} className="problems-grid">
            {[
              {
                label: '01',
                title: 'Surrounded by placement prep',
                desc: 'Your batch is grinding LeetCode and applying for internships. You want to build a product. The gap feels isolating.',
              },
              {
                label: '02',
                title: 'Ideas with nowhere to go',
                desc: 'You have startup ideas but no one serious to validate them with. The college canteen is not a boardroom.',
              },
              {
                label: '03',
                title: 'No system for consistency',
                desc: 'You start strong then lose steam. Without accountability, even the best ideas die in week three.',
              },
              {
                label: '04',
                title: 'No way to find your people',
                desc: 'LinkedIn is for professionals. Twitter is noise. There is no space built for builder students in India.',
              },
            ].map((item, i) => (
              <div key={i} className="problem-card">
                <p style={{
                  fontSize: '11px',
                  color: '#F97316',
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                  marginBottom: '16px',
                }}>
                  {item.label}
                </p>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 600,
                  color: '#F5F0E8',
                  marginBottom: '10px',
                  lineHeight: 1.3,
                }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: '14px', color: '#6A6A5A', lineHeight: 1.7 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section id="features" style={{
        padding: '80px 40px',
        borderTop: '1px solid #1A1A1A',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          <div style={{ marginBottom: '56px' }}>
            <div className="divider" style={{ marginBottom: '20px' }} />
            <h2 style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '40px',
              fontWeight: 400,
              color: '#F5F0E8',
              marginBottom: '12px',
            }}>
              Built for one thing.
            </h2>
            <p style={{ fontSize: '16px', color: '#6A6A5A', maxWidth: '480px', lineHeight: 1.7 }}>
              Every feature exists to help you find serious people and build real things.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }} className="features-grid">
            {[
              {
                number: '01',
                title: 'Builder Feed',
                desc: 'Post your startup idea. Get real feedback from people who are actually building. React, comment, connect.',
                highlight: 'Ideas get traction here',
              },
              {
                number: '02',
                title: 'Find Co-founders',
                desc: 'Browse builders by skill, college, and what they are looking for. Send a connection request in one click.',
                highlight: 'Teams form here',
              },
              {
                number: '03',
                title: 'Weekly Goals',
                desc: 'Set 3 goals every week. Mark them done. Build streaks. Your clan sees your progress.',
                highlight: 'Consistency lives here',
              },
            ].map((item, i) => (
              <div key={i} className="feature-card">
                <p style={{
                  fontSize: '11px',
                  color: '#F97316',
                  letterSpacing: '0.12em',
                  fontWeight: 600,
                  marginBottom: '24px',
                }}>
                  {item.number}
                </p>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: '#F5F0E8',
                  marginBottom: '12px',
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#6A6A5A',
                  lineHeight: 1.8,
                  marginBottom: '24px',
                }}>
                  {item.desc}
                </p>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  color: '#F97316',
                  fontWeight: 500,
                }}>
                  <span style={{ width: '16px', height: '1px', background: '#F97316', display: 'inline-block' }} />
                  {item.highlight}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MANIFESTO STRIP ── */}
      <section style={{
        padding: '80px 40px',
        borderTop: '1px solid #1A1A1A',
        borderBottom: '1px solid #1A1A1A',
        background: '#F97316',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{
            fontFamily: '"DM Serif Display", serif',
            fontSize: '48px',
            fontWeight: 400,
            color: '#111111',
            lineHeight: 1.2,
            maxWidth: '700px',
          }}>
            &ldquo;Proof over intention.<br />
            <span style={{ fontStyle: 'italic' }}>Action over consumption.&rdquo;</span>
          </h2>
          <p style={{
            fontSize: '15px',
            color: '#111111',
            opacity: 0.6,
            marginTop: '20px',
            fontWeight: 400,
          }}>
            The ClanSko principle. We are not here to plan. We are here to build.
          </p>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{ padding: '100px 40px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <span className="tag" style={{ marginBottom: '32px', display: 'inline-flex' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F97316', display: 'inline-block' }} />
            Free to join
          </span>
          <h2 className="cta-title" style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '52px',
            fontWeight: 400,
            color: '#F5F0E8',
            lineHeight: 1.1,
            marginBottom: '20px',
            marginTop: '16px',
          }}>
            Your people are<br />already here.
          </h2>
          <p style={{
            fontSize: '16px',
            color: '#6A6A5A',
            marginBottom: '40px',
            lineHeight: 1.7,
          }}>
            Stop waiting for the right time.<br />
            The right time is now. The right people are on ClanSko.
          </p>
          <Link href="/signup" className="btn-primary" style={{ fontSize: '16px', padding: '14px 36px' }}>
            Join ClanSko — it&apos;s free →
          </Link>
          <p style={{ fontSize: '13px', color: '#444', marginTop: '20px' }}>
            No credit card. No approval needed. Just show up.
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid #1A1A1A',
        padding: '32px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '22px', height: '22px',
            background: '#F97316',
            borderRadius: '5px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#111' }}>C</span>
          </div>
          <span style={{ fontSize: '14px', color: '#444', fontFamily: 'DM Sans' }}>
            ClanSko — Built by a builder, for builders.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <Link href="/login" style={{ fontSize: '13px', color: '#444', textDecoration: 'none' }}>Log in</Link>
          <Link href="/signup" style={{ fontSize: '13px', color: '#444', textDecoration: 'none' }}>Sign up</Link>
        </div>
      </footer>

    </main>
  )
}