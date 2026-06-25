import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { listKols } from '../lib/api'
import { C, btn, card } from '../theme'
import CreateKol from './CreateKol'
import KolTable from './KolTable'
import Commissions from './Commissions'

const usd = (n) => `$${Number(n || 0).toFixed(2)}`

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

  if (error && !data) {
    const denied = /forbidden/i.test(error)
    return (
      <Shell email={session.user.email} onSignOut={signOut}>
        <div style={{ ...card, textAlign: 'center' }} className="fade-up">
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

  const payouts = data?.payouts || []
  const stats = {
    payable: payouts.reduce((s, k) => s + Number(k.payable_now_usd || 0), 0),
    kols:    payouts.length,
    revenue: payouts.reduce((s, k) => s + Number(k.revenue_generated_usd || 0), 0),
    unpaid:  payouts.reduce((s, k) => s + Number(k.unpaid_incl_immature_usd || 0), 0),
  }

  return (
    <Shell email={session.user.email} onSignOut={signOut}>
      {loading && !data
        ? <div style={{ color: C.muted, padding: 40, textAlign: 'center' }}>Loading…</div>
        : (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Stats stats={stats} />
            <CreateKol onCreated={load} />
            <KolTable payouts={payouts} onChange={load} busy={loading} />
            <Commissions rows={data?.commissions || []} onChange={load} />
          </div>
        )}
    </Shell>
  )
}

function Stats({ stats }) {
  const items = [
    { label: 'Pay now (matured)', value: usd(stats.payable), accent: C.primary, hint: 'transfer this' },
    { label: 'Active KOLs',       value: stats.kols,          accent: C.text },
    { label: 'Revenue generated', value: usd(stats.revenue),  accent: C.blue },
    { label: 'Unpaid (all)',      value: usd(stats.unpaid),   accent: C.amber },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
      {items.map((it) => (
        <div key={it.label} style={{ ...card, padding: '15px 17px' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>{it.label}</div>
          <div style={{ fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.02em', marginTop: 7, color: it.accent }}>{it.value}</div>
          {it.hint && <div style={{ fontSize: '0.64rem', color: C.muted, marginTop: 3 }}>{it.hint}</div>}
        </div>
      ))}
    </div>
  )
}

function Shell({ email, onSignOut, children }) {
  return (
    <div style={{ minHeight: '100vh', color: C.text }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '26px 18px 72px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 16 }}>
          <div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.03em', display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ fontSize: '1.2rem' }}>♠</span> KOL Console
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
              <span style={{
                fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: '#1a0a08', background: 'linear-gradient(135deg,#ff9466,#f47067)', padding: '3px 9px', borderRadius: 5,
                boxShadow: '0 2px 10px rgba(244,112,103,0.35)',
              }}>● Live · Stripe live · Production DB</span>
            </div>
            <div style={{ fontSize: '0.74rem', color: C.muted, marginTop: 6 }}>MicroPoker Master · internal admin · not the customer app</div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.72rem', color: C.muted, marginBottom: 8, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '4px 11px' }}>
              <span style={{ width: 6, height: 6, borderRadius: 4, background: C.primary, boxShadow: `0 0 8px ${C.primary}` }} />
              <span style={{ wordBreak: 'break-all' }}>{email}</span>
            </div>
            <div><button onClick={onSignOut} style={{ ...btn('ghost'), padding: '6px 12px', fontSize: '0.74rem' }}>Sign out</button></div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
