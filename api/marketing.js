import { requireAdmin, adminDb } from '../lib/adminAuth.js'

// Marketing funnel by acquisition channel (the marketing_funnel view created in the
// app's db/migration-7). Read-only: one row per first-touch utm_source with
// visitors → logged_hand → signups → paid. Service-role read, behind the admin login.
export default async function handler(req, res) {
  const auth = await requireAdmin(req, res)
  if (!auth) return

  const db = adminDb()
  try {
    const { data, error } = await db
      .from('marketing_funnel')
      .select('*')
      .order('visitors', { ascending: false })
    if (error) throw error
    return res.status(200).json({ funnel: data || [] })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Could not load marketing funnel.' })
  }
}
