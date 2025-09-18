// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true,
    proxy: {
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBiYXNlOiAnLi8nLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaS93ZWF0aGVyJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5tZXQubm8nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiB7XG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChwYXRoLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICAgIGNvbnN0IGxhdCA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdsYXQnKTtcbiAgICAgICAgICBjb25zdCBsb24gPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnbG9uJyk7XG4gICAgICAgICAgcmV0dXJuIGAvd2VhdGhlcmFwaS9sb2NhdGlvbmZvcmVjYXN0LzIuMC9jb21wYWN0P2xhdD0ke2xhdH0mbG9uPSR7bG9ufWA7XG4gICAgICAgIH0sXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNaWxVQVMtRGFzaGJvYXJkLzEuMCAoY29udGFjdEBleGFtcGxlLmNvbSknXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnL2FwaS9hdmlhdGlvbic6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9hcGkubWV0Lm5vJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4ge1xuICAgICAgICAgIGNvbnN0IHVybCA9IG5ldyBVUkwocGF0aCwgJ2h0dHA6Ly9sb2NhbGhvc3QnKTtcbiAgICAgICAgICBjb25zdCBpY2FvID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2ljYW8nKTtcbiAgICAgICAgICByZXR1cm4gYC93ZWF0aGVyYXBpL3RhZm1ldGFyLzEuMC90YWZtZXRhci50eHQ/aWNhbz0ke2ljYW99YDtcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdVc2VyLUFnZW50JzogJ01pbFVBUy1EYXNoYm9hcmQvMS4wIChjb250YWN0QGV4YW1wbGUuY29tKSdcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBlbXB0eU91dERpcjogdHJ1ZVxuICB9XG59KVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLGdCQUFnQjtBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVM7QUFDakIsZ0JBQU0sTUFBTSxJQUFJLElBQUksTUFBTSxrQkFBa0I7QUFDNUMsZ0JBQU0sTUFBTSxJQUFJLGFBQWEsSUFBSSxLQUFLO0FBQ3RDLGdCQUFNLE1BQU0sSUFBSSxhQUFhLElBQUksS0FBSztBQUN0QyxpQkFBTyxnREFBZ0QsR0FBRyxRQUFRLEdBQUc7QUFBQSxRQUN2RTtBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsaUJBQWlCO0FBQUEsUUFDZixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUztBQUNqQixnQkFBTSxNQUFNLElBQUksSUFBSSxNQUFNLGtCQUFrQjtBQUM1QyxnQkFBTSxPQUFPLElBQUksYUFBYSxJQUFJLE1BQU07QUFDeEMsaUJBQU8sOENBQThDLElBQUk7QUFBQSxRQUMzRDtBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixhQUFhO0FBQUEsRUFDZjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
