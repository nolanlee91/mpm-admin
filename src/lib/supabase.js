import { createClient } from '@supabase/supabase-js'

// Same Supabase PROJECT as the customer app — only used here for the admin login.
// The anon key is public by design; all privileged reads/writes happen server-side
// in /api with the service role, gated by the ADMIN_EMAILS allowlist.
const url  = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, anon)
