import { createClient } from '@supabase/supabase-js'

// Shared gate for every admin API. Lives OUTSIDE /api so Vercel doesn't deploy it
// as its own endpoint — the api/*.js handlers import it.
//
// Two layers:
//   1. A valid Supabase session (Bearer token) — proves who you are.
//   2. That user's email is in the ADMIN_EMAILS allowlist — proves you're allowed.
// A customer could sign into the admin SPA with their own account, but without
// their email on the allowlist every API call returns 403, so they see nothing.

const url  = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const anon = () => process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY

function allowlist() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
}

// Verify the caller is a signed-in admin. On failure it writes the HTTP error and
// returns null — callers do `const a = await requireAdmin(req,res); if(!a) return`.
export async function requireAdmin(req, res) {
  if (!url() || !anon()) { res.status(500).json({ error: 'Auth not configured' }); return null }
  const allow = allowlist()
  if (!allow.length) { res.status(500).json({ error: 'No admins configured (set ADMIN_EMAILS)' }); return null }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) { res.status(401).json({ error: 'Unauthorized' }); return null }

  const { data: { user }, error } = await createClient(url(), anon()).auth.getUser(token)
  if (error || !user) { res.status(401).json({ error: 'Unauthorized' }); return null }
  if (!user.email || !allow.includes(user.email.toLowerCase())) {
    res.status(403).json({ error: 'Forbidden — not an admin account' })
    return null
  }
  return { user }
}

// Service-role client (bypasses RLS). Only call AFTER requireAdmin passes.
export function adminDb() {
  return createClient(url(), process.env.SUPABASE_SERVICE_ROLE_KEY)
}
