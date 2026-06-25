import { supabase } from './supabase'

// Every admin API call carries the Supabase session token; the server re-checks it
// AND the email allowlist before doing anything privileged.
async function authedFetch(path, opts = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  const res = await fetch(path, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(opts.body ? { body: JSON.stringify(opts.body) } : {}),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(json.error || `Request failed (${res.status})`)
    err.status = res.status
    throw err
  }
  return json
}

export const listKols     = ()              => authedFetch('/api/kols')
export const createKol    = (body)          => authedFetch('/api/create-kol', { method: 'POST', body })
export const markPaid     = (kol_id)        => authedFetch('/api/payout',     { method: 'POST', body: { kol_id } })
export const markReversed = (invoice)       => authedFetch('/api/reverse',    { method: 'POST', body: { stripe_invoice_id: invoice } })
