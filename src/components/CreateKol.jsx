import { useState } from 'react'
import { createKol } from '../lib/api'
import { C, btn, input } from '../theme'

const BLANK = { name: '', email: '', code: '', rate: '20', percent: '10', max: '' }

// Create-KOL form. Replaces `node scripts/create-kol.mjs` with a button: creates the
// Stripe promo code + the kols row server-side, then shows the code to send the KOL.
export default function CreateKol({ onCreated }) {
  const [f, setF]       = useState(BLANK)
  const [busy, setBusy] = useState(false)
  const [err, setErr]   = useState('')
  const [ok, setOk]     = useState(null)

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setErr(''); setOk(null)
    try {
      const res = await createKol({
        name: f.name,
        email: f.email || null,
        code: f.code,
        rate: Number(f.rate) / 100,       // UI is in %, API wants a fraction
        percent: Number(f.percent),
        max: f.max ? Number(f.max) : 0,
      })
      setOk(res)
      setF(BLANK)
      onCreated?.()
    } catch (e) {
      setErr(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section style={card}>
      <h2 style={h2}>Create KOL</h2>
      <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, alignItems: 'end' }}>
        <Field label="Name *"><input style={input} value={f.name} onChange={set('name')} placeholder="Nolan Lee" required /></Field>
        <Field label="Email"><input style={input} type="email" value={f.email} onChange={set('email')} placeholder="nolan@example.com" /></Field>
        <Field label="Promo code *"><input style={{ ...input, textTransform: 'uppercase' }} value={f.code} onChange={set('code')} placeholder="NOLAN" required /></Field>
        <Field label="Commission %"><input style={input} type="number" min="0" max="50" value={f.rate} onChange={set('rate')} /></Field>
        <Field label="Discount %"><input style={input} type="number" min="0" max="100" value={f.percent} onChange={set('percent')} /></Field>
        <Field label="Max uses (0 = ∞)"><input style={input} type="number" min="0" value={f.max} onChange={set('max')} placeholder="0" /></Field>
        <button type="submit" disabled={busy} style={{ ...btn('primary'), opacity: busy ? 0.6 : 1, cursor: busy ? 'not-allowed' : 'pointer' }}>
          {busy ? 'Creating…' : 'Create KOL'}
        </button>
      </form>

      {err && <div style={{ fontSize: '0.78rem', color: C.red, marginTop: 12 }}>{err}</div>}
      {ok && (
        <div style={{ fontSize: '0.82rem', color: C.primary, marginTop: 12, background: 'rgba(84,233,138,0.06)', border: '1px solid rgba(84,233,138,0.2)', borderRadius: 8, padding: '10px 12px' }}>
          ✓ Created <code style={codeTag}>{ok.code}</code> — {ok.message}
        </div>
      )}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: '0.66rem', color: C.muted, fontWeight: 700, marginBottom: 5 }}>{label}</div>
      {children}
    </label>
  )
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }
const h2 = { fontSize: '0.98rem', fontWeight: 700, margin: '0 0 14px' }
const codeTag = { fontFamily: 'ui-monospace,Menlo,monospace', background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }
