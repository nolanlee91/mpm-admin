import { requireAdmin, adminDb } from '../lib/adminAuth.js'

// Mark one commission as reversed (refund / chargeback) so kol_payouts excludes it.
// Idempotent: re-reversing an already-reversed row is a no-op (0 updated).
//
// NOTE: if the commission was ALREADY paid out, this only flags it — it does NOT
// claw back money you've sent. Handle a late refund as a negative adjustment in the
// next payout (see KOL-PILOT.md). `?undo=1`-style reactivation is intentionally not
// exposed; un-reverse manually in SQL if you ever need to.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = await requireAdmin(req, res)
  if (!auth) return

  const invoice = req.body?.stripe_invoice_id
  if (!invoice) return res.status(400).json({ error: 'stripe_invoice_id is required.' })

  const db = adminDb()
  try {
    const { data, error } = await db
      .from('commissions')
      .update({ reversed_at: new Date().toISOString() })
      .eq('stripe_invoice_id', invoice)
      .is('reversed_at', null)
      .select('id, paid_out_at')
    if (error) throw error

    const row = (data || [])[0]
    return res.status(200).json({
      reversed: data?.length || 0,
      was_already_paid: !!row?.paid_out_at, // true → claw back as a negative adjustment next payout
    })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Could not reverse commission.' })
  }
}
