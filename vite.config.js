import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Redireciona /api/* para o backend Express na porta 3001
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
        secure:       false,
      },
    },
  },
})
