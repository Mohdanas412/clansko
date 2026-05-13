// app/(app)/profile/page.jsx
// Redirector component routing navigation seamlessly to authenticated user's hub ID

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

export default function ProfileRedirect() {
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  useEffect(() => {
    async function redirectToOwnProfile() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      router.replace(`/profile/${user.id}`)
    }

    redirectToOwnProfile()
  }, [supabase, router])

  return (
    <div className="w-full h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-3 bg-background">
      <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <p className="text-xs text-muted-foreground font-medium font-mono animate-pulse">Loading your profile...</p>
    </div>
  )
}