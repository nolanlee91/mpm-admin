import { loadEnv } from 'vite'

// Dev-only plugin: run the Vercel-style /api functions inside `npm run dev`, so the
// whole app (login → create KOL → tables → payout) works locally with NO Vercel CLI.
// In production these same files run as real Vercel serverless functions untouched.
export function devApiPlugin() {
  return {
    name: 'dev-api',
    apply: 'serve',
    config(_, { mode }) {
      // Load ALL vars from .env / .env.local (not just VITE_*) into process.env so
      // the handlers can read SUPABASE_SERVICE_ROLE_KEY / STRIPE_SECRET_KEY / etc.
      const env = loadEnv(mode, process.cwd(), '')
      for (const [k, v] of Object.entries(env)) {
        if (process.env[k] === undefined) process.env[k] = v
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url || !req.url.startsWith('/api/')) return next()
        const [path, qs] = req.url.split('?')
        const name = path.replace(/^\/api\//, '').replace(/\/+$/, '')
        let handler
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          handler = mod.default
        } catch {
          res.statusCode = 404
          return res.end(JSON.stringify({ error: `No API route /api/${name}` }))
        }
        // Give the Node req/res the Vercel-ish shape the handlers expect.
        req.body  = await readJson(req)
        req.query = Object.fromEntries(new URLSearchParams(qs || ''))
        res.status = (code) => { res.statusCode = code; return res }
        res.json   = (obj)  => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)); return res }
        res.send   = (data) => { res.end(typeof data === 'string' ? data : JSON.stringify(data)); return res }
        try {
          await handler(req, res)
        } catch (e) {
          if (!res.writableEnded) { res.statusCode = 500; res.end(JSON.stringify({ error: e.message })) }
        }
      })
    },
  }
}

function readJson(req) {
  return new Promise((resolve) => {
    if (req.method === 'GET' || req.method === 'HEAD') return resolve(undefined)
    let data = ''
    req.on('data', (c) => { data += c })
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}) } catch { resolve({}) } })
    req.on('error', () => resolve({}))
  })
}
