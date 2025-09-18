// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "./",
  server: {
    host: true,
    proxy: {
      "/adsb-proxy": "http://127.0.0.1:3001",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBiYXNlOiAnLi8nLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2Fkc2ItcHJveHknOiAnaHR0cDovLzEyNy4wLjAuMTozMDAxJyxcbiAgICAgICcvYWRzYi1wcm94eSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDozMDAxJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYWRzYi1wcm94eS8sICcnKVxuICAgICAgfSxcbiAgICAgICcvYXBpL3dlYXRoZXInOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vYXBpLm1ldC5ubycsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHtcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHBhdGgsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgICAgY29uc3QgbGF0ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2xhdCcpO1xuICAgICAgICAgIGNvbnN0IGxvbiA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdsb24nKTtcbiAgICAgICAgICByZXR1cm4gYC93ZWF0aGVyYXBpL2xvY2F0aW9uZm9yZWNhc3QvMi4wL2NvbXBhY3Q/bGF0PSR7bGF0fSZsb249JHtsb259YDtcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdVc2VyLUFnZW50JzogJ01pbFVBUy1EYXNoYm9hcmQvMS4wIChjb250YWN0QGV4YW1wbGUuY29tKSdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICcvYXBpL2F2aWF0aW9uJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5tZXQubm8nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiB7XG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChwYXRoLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICAgIGNvbnN0IGljYW8gPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnaWNhbycpO1xuICAgICAgICAgIHJldHVybiBgL3dlYXRoZXJhcGkvdGFmbWV0YXIvMS4wL3RhZm1ldGFyLnR4dD9pY2FvPSR7aWNhb31gO1xuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1VzZXItQWdlbnQnOiAnTWlsVUFTLURhc2hib2FyZC8xLjAgKGNvbnRhY3RAZXhhbXBsZS5jb20pJ1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJ2Rpc3QnLFxuICAgIGVtcHR5T3V0RGlyOiB0cnVlXG4gIH1cbn0pIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF5TixTQUFTLG9CQUFvQjtBQUN0UCxPQUFPLFdBQVc7QUFHbEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUyxDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQ2pCLE1BQU07QUFBQSxFQUNOLFFBQVE7QUFBQSxJQUNOLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLGVBQWU7QUFBQSxNQUNmLGVBQWU7QUFBQSxRQUNiLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxpQkFBaUIsRUFBRTtBQUFBLE1BQ3JEO0FBQUEsTUFDQSxnQkFBZ0I7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTO0FBQ2pCLGdCQUFNLE1BQU0sSUFBSSxJQUFJLE1BQU0sa0JBQWtCO0FBQzVDLGdCQUFNLE1BQU0sSUFBSSxhQUFhLElBQUksS0FBSztBQUN0QyxnQkFBTSxNQUFNLElBQUksYUFBYSxJQUFJLEtBQUs7QUFDdEMsaUJBQU8sZ0RBQWdELEdBQUcsUUFBUSxHQUFHO0FBQUEsUUFDdkU7QUFBQSxRQUNBLFNBQVM7QUFBQSxVQUNQLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGlCQUFpQjtBQUFBLFFBQ2YsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVM7QUFDakIsZ0JBQU0sTUFBTSxJQUFJLElBQUksTUFBTSxrQkFBa0I7QUFDNUMsZ0JBQU0sT0FBTyxJQUFJLGFBQWEsSUFBSSxNQUFNO0FBQ3hDLGlCQUFPLDhDQUE4QyxJQUFJO0FBQUEsUUFDM0Q7QUFBQSxRQUNBLFNBQVM7QUFBQSxVQUNQLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsYUFBYTtBQUFBLEVBQ2Y7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
