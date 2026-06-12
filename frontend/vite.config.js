import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Coincidencias → FastAPI (scoring engine)
      '/api/coincidencias':     { target: 'http://localhost:8000', changeOrigin: true },
      // IA análisis foto → FastAPI
      '/api/ia':                { target: 'http://localhost:8000', changeOrigin: true },
      // Rutas del servidor Node
      '/api/reportes/resumen':  { target: 'http://localhost:3001', changeOrigin: true },
      '/api/reportes/exportar': { target: 'http://localhost:3001', changeOrigin: true },
      '/api/notificar':         { target: 'http://localhost:3001', changeOrigin: true },
      '/socket.io':             { target: 'http://localhost:3001', changeOrigin: true, ws: true },
      // Resto → Spring Boot API Gateway
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
    }
  }
})
