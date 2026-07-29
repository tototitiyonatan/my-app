import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const API_TARGET = 'https://soroka-server.onrender.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/staff': { target: API_TARGET, changeOrigin: true },
      '/stations': { target: API_TARGET, changeOrigin: true },
      '/schedules': { target: API_TARGET, changeOrigin: true },
      '/absences': { target: API_TARGET, changeOrigin: true },
      '/intern-stages': { target: API_TARGET, changeOrigin: true },
      '/leave-requests': { target: API_TARGET, changeOrigin: true },
      '/dashboard': { target: API_TARGET, changeOrigin: true },
    },
  },
})
