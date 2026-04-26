// lib/supabase.js
// This file creates a connection to your Supabase database
// Import this wherever you need to read/write data

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// createClient makes a reusable connection object
export const supabase = createClient(supabaseUrl, supabaseAnonKey)