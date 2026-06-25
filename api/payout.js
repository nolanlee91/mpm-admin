import { requireAdmin, adminDb } from '../lib/adminAuth.js'

// Mark a KOL's PAYABLE commissions as paid out. "Payable" mirrors the kol_payouts
// view exactly: matured (>30 days old, past the refund window), not yet paid, not
// reversed. Call this AFTER you've actually transferred the money.
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = await requireAdmin(req, res)
  if (!auth) return

  const kolId = req.body?.kol_id
  if (!kolId) return res.status(400).json({ error: 'kol_id is required.' })

  const db = adminDb()
  const cutoff = new Date(Date.now() - THIRTY_DAYS_MS).toISOString()
  const now = new Date().toISOString()

  try {
    const { data, error } = await db
      .from('commissions')
      .update({ paid_out_at: now })
      .eq('kol_id', kolId)
      .is('paid_out_at', null)
      .is('reversed_at', null)
      .lte('created_at', cutoff)
      .select('id, commission_amount')
    if (error) throw error

    const cents = (data || []).reduce((s, r) => s + (r.commission_amount || 0), 0)
    return res.status(200).json({ marked: data?.length || 0, total_usd: (cents / 100).toFixed(2) })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Could not mark payout.' })
  }
}
