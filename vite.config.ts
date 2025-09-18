import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/adsb-proxy': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsb-proxy/, '')
      },
      '/api/weather': {
        target: 'https://api.met.no',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/weather/, '/weatherapi/locationforecast/2.0/compact'),
        headers: {
          'User-Agent': 'MilUAS-Dashboard/1.0 (contact@example.com)'
        }
      },
      '/api/aviation': {
        target: 'https://api.met.no',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aviation/, '/weatherapi/tafmetar/1.0/tafmetar.txt'),
        headers: {
          'User-Agent': 'MilUAS-Dashboard/1.0 (contact@example.com)'
        }
      },
      '/api/adsb': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/adsb/, '/api/states/all')
      }
    }
  }
})