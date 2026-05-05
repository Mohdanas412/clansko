// app/(app)/profile/page.jsx
// Own profile page — gets current user's ID and redirects to /profile/[id]
// This is what the nav "Profile" link hits — /profile

'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function ProfileRedirect() {
  const router = useRouter()

  // Always use createBrowserClient in client components — never lib/supabase.js
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    async function redirectToOwnProfile() {
      // getUser() is more reliable than getSession() — always use this
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Not logged in — middleware should catch this but just in case
        router.push('/login')
        return
      }

      // Redirect to their own profile page
      router.replace(`/profile/${user.id}`)
    }

    redirectToOwnProfile()
  }, [])

  // Show a blank loading screen while redirecting — happens in <1 second
  return (
    <main
      style={{ backgroundColor: '#0f0f1a', minHeight: '100vh' }}
      className="flex items-center justify-center"
    >
      <p style={{ color: '#94a3b8', fontSize: '14px', letterSpacing: '0.08em' }}>
        Loading profile...
      </p>
    </main>
  )
}