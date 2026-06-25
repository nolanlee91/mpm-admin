import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listKols } from '../lib/api'
import { C, btn } from '../theme'
import CreateKol from './CreateKol'
import KolTable from './KolTable'
import Commissions from './Commissions'

export default function Dashboard({ session }) {
  const [data, setData]       = useState(null)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setData(await listKols()) }
    catch (e) { setError(e.message || 'Failed to load'); if (e.status === 403) setData(null) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const signOut = () => supabase.auth.signOut()

  // Access-denied (signed in, but not on the allowlist) or first-load error.
  if (error && !data) {
    const denied = /forbidden/i.test(error)
    return (
      <Shell email={session.user.email} onSignOut={signOut}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
          <div style={{ color: C.red, fontWeight: 700, marginBottom: 8 }}>{denied ? 'Not authorized' : 'Could not load'}</div>
          <div style={{ color: C.muted, fontSize: '0.84rem', lineHeight: 1.6 }}>
            {denied
              ? <>This account (<code>{session.user.email}</code>) is not on the admin allowlist. Add it to <code>ADMIN_EMAILS</code> in the environment.</>
              : error}
          </div>
          {!denied && <button onClick={load} style={{ ...btn('ghost'), marginTop: 14 }}>Retry</button>}
        </div>
      </Shell>
    )
  }

  return (
    <Shell email={session.user.email} onSignOut={signOut}>
      {loading && !data
        ? <div style={{ color: C.muted, padding: 24, textAlign: 'center' }}>Loading…</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <CreateKol onCreated={load} />
            <KolTable payouts={data?.payouts || []} onChange={load} busy={loading} />
            <Commissions rows={data?.commissions || []} onChange={load} />
          </div>
        )}
    </Shell>
  )
}

function Shell({ email, onSignOut, children }) {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: "'Inter',sans-serif" }}>
      <div style={{ maxWidth: 940, margin: '0 auto', padding: '20px 16px 64px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em' }}>📊 KOL Console</div>
            <div style={{ fontSize: '0.74rem', color: C.muted }}>MicroPoker Master · internal admin</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.72rem', color: C.muted, marginBottom: 6, wordBreak: 'break-all' }}>{email}</div>
            <button onClick={onSignOut} style={{ ...btn('ghost'), padding: '6px 12px', fontSize: '0.74rem' }}>Sign out</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
