import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/switchback/' : '/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['maplibre-gl'],
  },
  server: {
    host: true,
    allowedHosts: true,
  },
})

