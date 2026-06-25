import Stripe from 'stripe'
import { requireAdmin, adminDb } from '../lib/adminAuth.js'

// Onboard a KOL: create their Stripe promotion code + insert the kols row.
// Same logic as the app's scripts/create-kol.mjs, but behind the admin login so
// the founder clicks a button instead of running a terminal command.
//
// One shared coupon (10% off, repeating 12 months) is reused for everyone; each
// KOL gets their own promotion CODE pointing at it. The code is the attribution
// key the app's webhook reads to credit commission.
const SHARED_COUPON_LOOKUP = 'mpm-kol-yr1'
// The customer discount is FIXED — all KOLs share ONE Stripe coupon, so it can't be
// per-KOL. (A per-KOL "discount %" would silently reuse the shared coupon's real
// value and mislead.) Commission rate IS per-KOL; discount is not.
const FIXED_DISCOUNT = 10

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = await requireAdmin(req, res)
  if (!auth) return

  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Stripe not configured' })

  const b = req.body || {}
  const code    = String(b.code || '').trim().toUpperCase()
  const name    = String(b.name || '').trim()
  const email   = b.email ? String(b.email).trim() : null
  const rate    = b.rate    != null ? Number(b.rate)    : 0.20
  const maxRed  = b.max     != null ? Number(b.max)     : 0

  if (!code || !name) return res.status(400).json({ error: 'Name and code are required.' })
  if (!/^[A-Z0-9]{3,20}$/.test(code)) return res.status(400).json({ error: 'Code must be 3–20 letters/numbers, no spaces.' })
  if (!(rate > 0 && rate <= 0.5)) return res.status(400).json({ error: 'Commission rate must be between 0 and 0.5.' })

  const stripe = new Stripe(STRIPE_SECRET_KEY)
  const db = adminDb()

  try {
    // 1. Find or create the shared "X% off, repeating 12 months" coupon.
    const existing = await stripe.coupons.list({ limit: 100 })
    let coupon = existing.data.find((c) => c.metadata?.lookup === SHARED_COUPON_LOOKUP)
    if (!coupon) {
      coupon = await stripe.coupons.create({
        percent_off: FIXED_DISCOUNT,
        duration: 'repeating',
        duration_in_months: 12,
        name: `MPM KOL — ${FIXED_DISCOUNT}% off year 1`,
        metadata: { lookup: SHARED_COUPON_LOOKUP },
      })
    }
    // Always report the coupon's REAL discount (even if it pre-existed), never an
    // operator-supplied number — so the message can't claim a discount that isn't applied.
    const percent = coupon.percent_off

    // 2. Create this KOL's promotion code pointing at the shared coupon.
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      ...(maxRed > 0 ? { max_redemptions: maxRed } : {}),
      metadata: { kol: name },
    })

    // 3. Insert the kols row (the webhook reads this to credit commission).
    const { data, error } = await db.from('kols').insert({
      name,
      email,
      promo_code: promo.code,
      stripe_promotion_code_id: promo.id,
      stripe_coupon_id: coupon.id,
      commission_rate: rate,
    }).select('id').single()

    if (error) {
      // The Stripe code now exists but the DB insert failed — surface clearly so
      // the operator can delete the orphan promo code or retry.
      return res.status(500).json({
        error: `Stripe code ${promo.code} was created, but saving to the database failed: ${error.message}. Delete the code in Stripe before retrying.`,
      })
    }

    return res.status(200).json({
      id: data.id,
      code: promo.code,
      percent,
      rate,
      message: `${promo.code} → ${percent}% off, you earn ${Math.round(rate * 100)}% of revenue for their first year.`,
    })
  } catch (e) {
    // Stripe rejects a duplicate code → friendly message.
    const msg = /already exists|resource_already_exists/i.test(e.message || '')
      ? `A promo code "${code}" already exists in Stripe. Pick a different code.`
      : (e.message || 'Could not create KOL.')
    return res.status(400).json({ error: msg })
  }
}
