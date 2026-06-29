import { useEffect, useState } from 'react'
import { listMarketing } from '../lib/api'
import { C, card, accentBar } from '../theme'

const num = (n) => Number(n || 0).toLocaleString()
const pct = (a, b) => (Number(b) > 0 ? `${Math.round((Number(a) / Number(b)) * 100)}%` : '—')

// Marketing funnel by acquisition channel (marketing_funnel view). Self-fetching so a
// failure here never blocks the KOL dashboard. Read where each channel leaks:
// visitors → logged a hand → signed up → paid.
export default function Marketing() {
  const [rows, setRows]       = useState(null)
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    listMarketing()
      .then((d) => { if (alive) setRows(d.funnel || []) })
      .catch((e) => { if (alive) setErr(e.message || 'Failed to load') })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const missing = /relation|does not exist|not find/i.test(err)

  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <span style={accentBar} />
        <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>Marketing funnel</h2>
      </div>
      <p style={hint}>By the channel that first brought each visitor (<code style={codeTag}>utm_source</code>). Read where it leaks: visitors → hand → signup → paid.</p>

      {loading ? (
        <div style={empty}>Loading…</div>
      ) : err ? (
        <div style={{ ...empty, color: C.red }}>
          {missing ? 'Funnel not found — run db/migration-7 in Supabase first.' : err}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={table}>
            <thead>
              <tr>
                {['Channel', 'Visitors', 'Logged hand', 'Signups', 'Paid', 'Visit→Signup', 'Signup→Paid'].map((h, i) => (
                  <th key={i} style={{ ...th, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan={7} style={empty}>No attribution yet — share a link with <code style={codeTag}>?utm_source=…</code> to start.</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.source}>
                  <td style={td}>{r.source}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{num(r.visitors)}</td>
                  <td style={{ ...td, textAlign: 'right', color: C.muted }}>{num(r.logged_hand)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{num(r.signups)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: Number(r.paid) > 0 ? C.primary : C.muted }}>{num(r.paid)}</td>
                  <td style={{ ...td, textAlign: 'right', color: C.muted }}>{pct(r.signups, r.visitors)}</td>
                  <td style={{ ...td, textAlign: 'right', color: C.muted }}>{pct(r.paid, r.signups)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

const hint = { fontSize: '0.74rem', color: C.muted, margin: '6px 0 14px', lineHeight: 1.5 }
const table = { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }
const th = { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, padding: '8px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }
const td = { padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }
const empty = { padding: 18, textAlign: 'center', color: C.muted }
const codeTag = { fontFamily: 'ui-monospace,Menlo,monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }
