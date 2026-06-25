import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plain Vite + React SPA. The /api functions are Vercel serverless handlers and
// are NOT processed by Vite — they run on Vercel (or `vercel dev`) only.
export default defineConfig({
  plugins: [react()],
})
