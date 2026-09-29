// lib/supabase-server.js
// Standardized Supabase Server Client helper for Next.js App Router Route Handlers & Server Actions.

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates and returns a Supabase server client wired to cookies.
 * Handles both async/sync cookies() gracefully across Next.js versions.
 */
export async function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
  }

  const cookieStore = await cookies()

  return createServerClient(url, key, {
    cookies: {
      get(name) {
        return cookieStore.get(name)?.value
      },
      set(name, value, options) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Setting cookies is only allowed in Server Actions or Route Handlers
        }
      },
      remove(name, options) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Setting cookies is only allowed in Server Actions or Route Handlers
        }
      },
    },
  })
}
