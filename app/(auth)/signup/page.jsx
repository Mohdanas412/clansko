'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const result = await response.json();

      if (response.ok) {
        // Also sign in on client side
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (signInError) {
          toast.error(signInError.message);
          setLoading(false);
          return;
        }

        toast.success('Account created!');
        window.location.href = '/onboarding';
      } else {
        toast.error(result.error || 'Signup failed');
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast.error('Something went wrong');
    }

    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#111111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '40px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: '#F97316',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '24px',
            fontWeight: '700',
            color: '#111111'
          }}>
            C
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '24px',
            fontWeight: '600',
            color: '#F5F0E8'
          }}>
            ClanSko
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#161616',
          border: '1px solid #1E1E1E',
          borderRadius: '12px',
          padding: '40px'
        }}>
          
          {/* Orange accent bar */}
          <div style={{
            width: '28px',
            height: '3px',
            background: '#F97316',
            borderRadius: '2px',
            marginBottom: '16px'
          }}></div>

          <h1 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '32px',
            fontWeight: '400',
            fontStyle: 'italic',
            color: '#F5F0E8',
            marginBottom: '8px'
          }}>
            Join ClanSko
          </h1>

          <p style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '15px',
            color: '#9A9A8A',
            marginBottom: '32px'
          }}>
            Find your tribe of serious builders
          </p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: '500',
                color: '#9A9A8A',
                marginBottom: '8px'
              }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  width: '100%',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: '#F5F0E8'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: '500',
                color: '#9A9A8A',
                marginBottom: '8px'
              }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                style={{
                  width: '100%',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: '#F5F0E8'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '13px',
                fontWeight: '500',
                color: '#9A9A8A',
                marginBottom: '8px'
              }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                style={{
                  width: '100%',
                  background: '#111111',
                  border: '1px solid #2A2A2A',
                  borderRadius: '8px',
                  padding: '12px',
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: '14px',
                  color: '#F5F0E8'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: '#F97316',
                color: '#111111',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                marginTop: '8px'
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div style={{
  marginTop: '24px',
  paddingTop: '24px',
  borderTop: '1px solid #1E1E1E',
  textAlign: 'center'
}}>
  <span style={{
    fontFamily: "'DM Sans', sans-serif",
    fontSize: '14px',
    color: '#9A9A8A'
  }}>
    Already have an account?{' '}
  </span>
  <button
    onClick={() => router.push('/login')}
    style={{
      background: 'transparent',
      border: 'none',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '14px',
      fontWeight: '600',
      color: '#F97316',
      textDecoration: 'none',
      cursor: 'pointer',
      padding: 0
    }}
  >
    Sign in
  </button>
</div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          fontFamily: "'DM Sans', sans-serif",
          fontSize: '13px',
          color: '#6A6A5A'
        }}>
          Where builders find their tribe
        </div>
      </div>
    </div>
  );
}