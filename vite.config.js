import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devApiPlugin } from './vite-dev-api.mjs'

// Plain Vite + React SPA. devApiPlugin runs the /api functions during `npm run dev`
// so the app works fully locally; in production those files run as Vercel serverless
// functions (the plugin is dev-only — apply:'serve').
export default defineConfig({
  plugins: [react(), devApiPlugin()],
})
