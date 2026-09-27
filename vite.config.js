import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api/recipes': 'http://localhost:8000',
      '/api/adaptations': 'http://localhost:8000',
      '/api/uploads': 'http://localhost:8000',
    },
  },
})