// lib/supabase.js
import { createClient } from '@supabase/supabase-js'

// Singleton pattern — only one instance created
let supabaseInstance = null

export function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabaseInstance
}

// Keep this for backward compatibility with existing imports
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)