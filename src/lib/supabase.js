import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Null when env vars are absent (e.g. a fresh clone) — the contribution forms
// and admin page render a "not configured" notice instead of crashing.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const isSupabaseConfigured = supabase !== null
