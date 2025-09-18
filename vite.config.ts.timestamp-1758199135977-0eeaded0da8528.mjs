// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true,
    proxy: {
      "/adsb-proxy": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/adsb-proxy/, "")
      },
      "/api/weather": {
        target: "https://api.met.no",
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, "http://localhost");
          const lat = url.searchParams.get("lat");
          const lon = url.searchParams.get("lon");
          return `/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;
        },
        headers: {
          "User-Agent": "MilUAS-Dashboard/1.0 (contact@example.com)"
        }
      },
      "/api/aviation": {
        target: "https://api.met.no",
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, "http://localhost");
          const icao = url.searchParams.get("icao");
          return `/weatherapi/tafmetar/1.0/tafmetar.txt?icao=${icao}`;
        },
        headers: {
          "User-Agent": "MilUAS-Dashboard/1.0 (contact@example.com)"
        }
      }
    }
  },
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBiYXNlOiAnLi8nLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2Fkc2ItcHJveHknOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6MzAwMScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2Fkc2ItcHJveHkvLCAnJylcbiAgICAgIH0sXG4gICAgICAnL2FwaS93ZWF0aGVyJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5tZXQubm8nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiB7XG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChwYXRoLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICAgIGNvbnN0IGxhdCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdsYXQnKTtcbiAgICAgICAgICBjb25zdCBsb24gPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnbG9uJyk7XG4gICAgICAgICAgcmV0dXJuIGAvd2VhdGhlcmFwaS9sb2NhdGlvbmZvcmVjYXN0LzIuMC9jb21wYWN0P2xhdD0ke2xhdH0mbG9uPSR7bG9ufWA7XG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNaWxVQVMtRGFzaGJvYXJkLzEuMCAoY29udGFjdEBleGFtcGxlLmNvbSknXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnL2FwaS9hdmlhdGlvbic6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcGkubWV0Lm5vJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocGF0aCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgICBjb25zdCBpY2FvID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2ljYW8nKTtcbiAgICAgICAgICByZXR1cm4gYC93ZWF0aGVyYXBpL3RhZm1ldGFyLzEuMC90YWZtZXRhci50eHQ/aWNhbz0ke2ljYW99YDtcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdVc2VyLUFnZW50JzogJ01pbFVBUy1EYXNoYm9hcmQvMS4wIChjb250YWN0QGV4YW1wbGUuY29tKSdcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZVxuICB9XG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixNQUFNO0FBQUEsRUFDTixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxlQUFlO0FBQUEsUUFDYixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsaUJBQWlCLEVBQUU7QUFBQSxNQUNyRDtBQUFBLE1BQ0EsZ0JBQWdCO0FBQUEsUUFDZCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUztBQUNqQixnQkFBTSxNQUFNLElBQUksSUFBSSxNQUFNLGtCQUFrQjtBQUM1QyxnQkFBTSxNQUFNLElBQUksYUFBYSxJQUFJLEtBQUs7QUFDdEMsZ0JBQU0sTUFBTSxJQUFJLGFBQWEsSUFBSSxLQUFLO0FBQ3RDLGlCQUFPLGdEQUFnRCxHQUFHLFFBQVEsR0FBRztBQUFBLFFBQ3ZFO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDUCxjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUEsTUFDQSxpQkFBaUI7QUFBQSxRQUNmLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTO0FBQ2pCLGdCQUFNLE1BQU0sSUFBSSxJQUFJLE1BQU0sa0JBQWtCO0FBQzVDLGdCQUFNLE9BQU8sSUFBSSxhQUFhLElBQUksTUFBTTtBQUN4QyxpQkFBTyw4Q0FBOEMsSUFBSTtBQUFBLFFBQzNEO0FBQUEsUUFDQSxTQUFTO0FBQUEsVUFDUCxjQUFjO0FBQUEsUUFDaEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxFQUNmO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
