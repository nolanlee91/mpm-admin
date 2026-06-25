import { useState } from 'react'
import { markPaid } from '../lib/api'
import { C, btn } from '../theme'

const usd = (n) => `$${Number(n || 0).toFixed(2)}`

// KOL roster + payout summary (from the kol_payouts view). "Pay now" is the only
// number to transfer from. After paying, click "Mark paid" to stamp those rows.
export default function KolTable({ payouts, onChange, busy }) {
  const [working, setWorking] = useState(null) // kol id being marked
  const [note, setNote]       = useState('')

  async function pay(k) {
    if (!k.payable_now_usd || Number(k.payable_now_usd) <= 0) return
    if (!window.confirm(`Confirm you've TRANSFERRED ${usd(k.payable_now_usd)} to ${k.name}? This stamps those commissions as paid.`)) return
    setWorking(k.id); setNote('')
    try {
      const res = await markPaid(k.id)
      setNote(`✓ ${k.name}: marked ${res.marked} commission(s) paid ($${res.total_usd}).`)
      onChange?.()
    } catch (e) {
      setNote(`✗ ${e.message}`)
    } finally {
      setWorking(null)
    }
  }

  return (
    <section style={card}>
      <h2 style={h2}>KOLs &amp; payouts</h2>
      <p style={hint}>Pay from <b style={{ color: C.primary }}>Pay&nbsp;now</b> only (matured &gt;30d, unpaid, not reversed). Transfer first, then “Mark paid”.</p>

      <div style={{ overflowX: 'auto' }}>
        <table style={table}>
          <thead>
            <tr>
              {['KOL', 'Code', '%', 'Pay now', 'Unpaid (incl. immature)', 'Already paid', 'Revenue', ''].map((h, i) => (
                <th key={i} style={{ ...th, textAlign: i >= 3 && i <= 6 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {payouts.length === 0 && (
              <tr><td colSpan={8} style={empty}>No KOLs yet — create one above.</td></tr>
            )}
            {payouts.map((k) => {
              const payable = Number(k.payable_now_usd || 0)
              return (
                <tr key={k.id}>
                  <td style={td}>{k.name}{k.active ? '' : <span style={{ color: C.muted }}> (off)</span>}</td>
                  <td style={td}><code style={codeTag}>{k.promo_code}</code></td>
                  <td style={td}>{Math.round((k.commission_rate ?? 0.2) * 100) || ''}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: payable > 0 ? C.primary : C.muted }}>{usd(payable)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>{usd(k.unpaid_incl_immature_usd)}</td>
                  <td style={{ ...td, textAlign: 'right', color: C.muted }}>{usd(k.already_paid_usd)}</td>
                  <td style={{ ...td, textAlign: 'right', color: C.muted }}>{usd(k.revenue_generated_usd)}</td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    <button
                      onClick={() => pay(k)}
                      disabled={payable <= 0 || working === k.id || busy}
                      style={{ ...btn('ghost'), padding: '5px 10px', fontSize: '0.72rem', opacity: payable <= 0 ? 0.4 : 1, cursor: payable <= 0 ? 'not-allowed' : 'pointer' }}
                    >
                      {working === k.id ? '…' : 'Mark paid'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {note && <div style={{ fontSize: '0.78rem', color: note.startsWith('✓') ? C.primary : C.red, marginTop: 10 }}>{note}</div>}
    </section>
  )
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }
const h2 = { fontSize: '0.98rem', fontWeight: 700, margin: '0 0 4px' }
const hint = { fontSize: '0.74rem', color: C.muted, margin: '0 0 12px', lineHeight: 1.5 }
const table = { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }
const th = { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, padding: '8px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }
const td = { padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }
const empty = { padding: 18, textAlign: 'center', color: C.muted }
const codeTag = { fontFamily: 'ui-monospace,Menlo,monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }
