import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { C, btn, input } from '../theme'

// Admin login. Uses the same Supabase project as the app, but only emails on the
// server's ADMIN_EMAILS allowlist can actually DO anything — a non-admin who signs
// in here just hits 403 on every API call (Dashboard shows an access-denied screen).
export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw]       = useState('')
  const [err, setErr]     = useState('')
  const [busy, setBusy]   = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pw })
    if (error) { setErr(error.message); setBusy(false) }
    // On success onAuthStateChange in App swaps to the Dashboard.
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: C.bg, color: C.text, fontFamily: "'Inter',sans-serif", padding: 16 }}>
      <form onSubmit={submit} style={{ width: '100%', maxWidth: 340, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: '24px 22px' }}>
        <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 4 }}>🔒 MPM Admin</div>
        <div style={{ fontSize: '0.76rem', color: C.muted, marginBottom: 18 }}>Internal — KOL & payouts. Authorized accounts only.</div>

        <label style={{ fontSize: '0.7rem', color: C.muted, fontWeight: 700 }}>Email</label>
        <input style={{ ...input, margin: '6px 0 12px' }} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />

        <label style={{ fontSize: '0.7rem', color: C.muted, fontWeight: 700 }}>Password</label>
        <input style={{ ...input, margin: '6px 0 16px' }} type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />

        {err && <div style={{ fontSize: '0.76rem', color: C.red, marginBottom: 12 }}>{err}</div>}

        <button type="submit" disabled={busy} style={{ ...btn('primary'), width: '100%', opacity: busy ? 0.6 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
