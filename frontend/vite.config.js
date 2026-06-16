import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Rutas del servidor Node (antes que /api para tomar precedencia)
      '/api/reportes/resumen':  { target: 'http://localhost:3001', changeOrigin: true },
      '/api/reportes/exportar': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/notificar':         { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io':             { target: 'http://localhost:3001', changeOrigin: true, ws: true },
      // Todo lo demás → API Gateway (incluye /api/coincidencias, /api/match, /api/ia, etc.)
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    }
  }
})
