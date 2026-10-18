import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // в dev-режиме (npm run dev) запросы /api уходят на FastAPI
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
})
