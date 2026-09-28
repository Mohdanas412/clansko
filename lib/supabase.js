// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Singleton pattern — only one instance created, lazy-initialized to prevent build crashes
let supabaseInstance = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    // Validate environment variables at runtime, not import time
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required')
    }

    supabaseInstance = createClient(url, key)
  }
  return supabaseInstance
}