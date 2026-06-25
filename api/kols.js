import { requireAdmin, adminDb } from '../lib/adminAuth.js'

// Read the KOL roster + payout summary (kol_payouts view) and recent commissions.
// Everything the dashboard needs in one call.
export default async function handler(req, res) {
  const auth = await requireAdmin(req, res)
  if (!auth) return

  const db = adminDb()
  try {
    const [{ data: payouts, error: pErr }, { data: commissions, error: cErr }] = await Promise.all([
      db.from('kol_payouts').select('*').order('payable_now_usd', { ascending: false }),
      db
        .from('commissions')
        .select('created_at, gross_amount, commission_amount, paid_out_at, reversed_at, stripe_invoice_id, kol_id, kols(promo_code, name)')
        .order('created_at', { ascending: false })
        .limit(200),
    ])
    if (pErr) throw pErr
    if (cErr) throw cErr
    return res.status(200).json({ payouts: payouts || [], commissions: commissions || [] })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Could not load KOLs.' })
  }
}
