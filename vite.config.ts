import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true,
    proxy: {
      '/adsb-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsb-proxy/, ''),
      },
      '/api/weather': {
        target: 'https://api.met.no',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const lat = url.searchParams.get('lat');
          const lon = url.searchParams.get('lon');
          return `/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
        },
        headers: {
          'User-Agent': 'MilUAS-Dashboard/1.0 (contact@example.com)'
        }
      },
      '/api/aviation': {
        target: 'https://api.met.no',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const icao = url.searchParams.get('icao');
          return `/weatherapi/tafmetar/1.0/tafmetar.txt?icao=${icao}`;
        },
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