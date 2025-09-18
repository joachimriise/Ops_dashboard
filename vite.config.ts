import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  plugins: [react()],
  base: './',
  server: {
    host: true,
    host: true,
    proxy: {
      '/adsb-proxy': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsb-proxy/, '')
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
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
      }
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})