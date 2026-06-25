import { useState } from 'react'
import { markReversed } from '../lib/api'
import { C, btn, card, accentBar } from '../theme'

const cents = (c) => `$${(Number(c || 0) / 100).toFixed(2)}`
const when  = (iso) => (iso ? String(iso).slice(0, 16).replace('T', ' ') : '—')

// Recent commissions (last 200), newest first. Each can be reversed (refund /
// chargeback) so the payout view excludes it.
export default function Commissions({ rows, onChange }) {
  const [working, setWorking] = useState(null)
  const [note, setNote]       = useState('')

  async function reverse(c) {
    if (!window.confirm(`Mark commission for invoice ${c.stripe_invoice_id} as reversed (refund/chargeback)? It will be excluded from payouts.`)) return
    setWorking(c.stripe_invoice_id); setNote('')
    try {
      const res = await markReversed(c.stripe_invoice_id)
      setNote(res.was_already_paid
        ? `⚠ Reversed — but this was ALREADY paid out. Claw it back as a negative adjustment next payout (see KOL-PILOT.md).`
        : `✓ Reversed — removed from payouts.`)
      onChange?.()
    } catch (e) {
      setNote(`✗ ${e.message}`)
    } finally {
      setWorking(null)
    }
  }

  return (
    <section style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 14 }}>
        <span style={accentBar} />
        <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0 }}>Recent commissions <span style={{ color: C.muted, fontWeight: 400, fontSize: '0.8rem' }}>(last {rows.length})</span></h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={table}>
          <thead>
            <tr>
              {['When (UTC)', 'KOL', 'Code', 'Gross', 'Commission', 'State', ''].map((h, i) => (
                <th key={i} style={{ ...th, textAlign: i === 3 || i === 4 ? 'right' : 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} style={empty}>No commissions recorded yet.</td></tr>}
            {rows.map((c) => {
              const reversed = !!c.reversed_at
              const paid     = !!c.paid_out_at
              return (
                <tr key={c.stripe_invoice_id} style={{ opacity: reversed ? 0.5 : 1 }}>
                  <td style={td}>{when(c.created_at)}</td>
                  <td style={td}>{c.kols?.name || '—'}</td>
                  <td style={td}><code style={codeTag}>{c.kols?.promo_code || '—'}</code></td>
                  <td style={{ ...td, textAlign: 'right' }}>{cents(c.gross_amount)}</td>
                  <td style={{ ...td, textAlign: 'right', fontWeight: 700 }}>{cents(c.commission_amount)}</td>
                  <td style={td}>
                    {reversed ? <Pill c={C.red} bg="rgba(244,112,103,0.16)">reversed</Pill>
                      : paid    ? <Pill c={C.primary} bg="rgba(84,233,138,0.16)">paid</Pill>
                      :           <Pill c={C.amber} bg="rgba(255,179,71,0.16)">unpaid</Pill>}
                  </td>
                  <td style={{ ...td, textAlign: 'right' }}>
                    {!reversed && (
                      <button onClick={() => reverse(c)} disabled={working === c.stripe_invoice_id}
                        style={{ ...btn('danger'), padding: '4px 9px', fontSize: '0.7rem' }}>
                        {working === c.stripe_invoice_id ? '…' : 'Reverse'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {note && <div style={{ fontSize: '0.78rem', color: note.startsWith('✗') ? C.red : note.startsWith('⚠') ? C.amber : C.primary, marginTop: 10, lineHeight: 1.5 }}>{note}</div>}
    </section>
  )
}

function Pill({ c, bg, children }) {
  return <span style={{ fontSize: '0.6rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, color: c, background: bg }}>{children}</span>
}

const table = { width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }
const th = { fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: C.muted, padding: '8px 10px', borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }
const td = { padding: '9px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', whiteSpace: 'nowrap' }
const empty = { padding: 18, textAlign: 'center', color: C.muted }
const codeTag = { fontFamily: 'ui-monospace,Menlo,monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }
