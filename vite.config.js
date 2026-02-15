import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // ⚡ This rule tells Vite: "If a request starts with /api, send it to the real backend"
      '/api': {
        target: 'https://ailern.runasp.net',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
