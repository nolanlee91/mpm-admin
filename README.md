# MPM Admin — internal KOL console

Internal admin tool for **MicroPoker Master**. NOT the customer app. Onboard KOLs
(creates the Stripe promo code + `kols` row), see each KOL's revenue / commission /
payable, mark payouts paid, and reverse refunded commissions.

- **Separate** from the customer app (`micropoker-master-app`) and the landing repo.
- Reads/writes the **same Supabase project** (`kols`, `commissions`, `kol_payouts`,
  `pro_grants`) via the service role — **server-side only**, gated by an email allowlist.
- Meant to run at its own domain, e.g. `admin.micropokermaster.com`.

## Stack
Vite + React SPA, Vercel serverless (`/api`), Supabase Auth for login.

```
src/            frontend (login + dashboard)
api/            serverless endpoints (create-kol, kols, payout, reverse)
lib/adminAuth.js  shared gate: valid session + ADMIN_EMAILS allowlist
```

## Security model
1. You log in with Supabase Auth (same project as the app).
2. Every `/api/*` call re-verifies the token **and** checks the email is in
   `ADMIN_EMAILS`. Anyone not on the list gets `403` — so a customer signing in here
   sees nothing.
3. The service-role key and `STRIPE_SECRET_KEY` live **only** in server env, never
   shipped to the browser.

---

## One-time setup checklist

### 1. GitHub
Create a new **private** repo `mpm-admin`, then from this folder:
```bash
git init && git add -A && git commit -m "init mpm-admin"
git branch -M main
git remote add origin https://github.com/<you>/mpm-admin.git
git push -u origin main
```

### 2. Vercel
- New Project → import the `mpm-admin` repo (Vercel auto-detects Vite).
- Add the environment variables below (Production + Preview).
- Deploy.

### 3. Environment variables (Vercel → Settings → Environment Variables)
See `.env.example`. You need:

| Var | Where it's used | Value |
|---|---|---|
| `VITE_SUPABASE_URL` | frontend login | same as the app |
| `VITE_SUPABASE_ANON_KEY` | frontend login | same as the app |
| `SUPABASE_URL` | server | same as the app |
| `SUPABASE_SERVICE_ROLE_KEY` | server | Supabase → Settings → API |
| `STRIPE_SECRET_KEY` | server (create promo codes) | **sk_live** |
| `ADMIN_EMAILS` | server allowlist | your email(s), comma-separated |

### 4. Custom domain
Vercel → Project → Domains → add `admin.micropokermaster.com`. Vercel shows the DNS
record to add at **Namecheap** (a CNAME to `cname.vercel-dns.com`, or the value
Vercel gives). Wait for it to verify.

### 5. Admin account
The login uses Supabase Auth. Use an account whose email is in `ADMIN_EMAILS`. If you
don't have one, create it in Supabase → Authentication → Users (or sign up once and
confirm), then make sure that email is on the allowlist.

---

## Prerequisite migrations (in the app's Supabase project)
These tables/views must already exist (run from the app repo's `db/`):
- `migration-4-referrals.sql` → `kols`, `commissions`, `kol_payouts`
- `migration-6-pro-grants.sql` → `pro_grants` (for future comp-Pro support)

## Local dev
`npm run dev` runs the **full app locally** — `vite-dev-api.mjs` is a dev-only Vite
plugin that serves the `/api` functions and loads non-`VITE_` env from `.env.local`,
so login → create KOL → tables → payout all work without the Vercel CLI. Copy
`.env.example` to `.env.local` and fill in real values first. (In production those same
files run as Vercel serverless functions; the plugin is `apply:'serve'`, dev-only.)

## What this does NOT do (yet)
- KOL self-service login (KOLs can't log in — you report their numbers).
- Click/funnel analytics (promo code only sees PAID conversions; needs UTM later).
- Auto-reverse on refund/chargeback (reverse manually here; see KOL-PILOT.md). A
  late refund on an already-paid commission must be clawed back as a negative
  adjustment in the next payout.
