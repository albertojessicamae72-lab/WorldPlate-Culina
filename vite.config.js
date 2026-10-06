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
      '/api/accounts': 'http://127.0.0.1:8000',
      '/api/recipes': 'http://127.0.0.1:8000',
      '/api/adaptations': 'http://127.0.0.1:8000',
      '/api/uploads': 'http://127.0.0.1:8000',
    },
  },
})
