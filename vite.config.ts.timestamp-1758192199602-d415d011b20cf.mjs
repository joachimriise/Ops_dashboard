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
        target: "http://localhost:8080",
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
      },
      "/api/adsb": {
        target: "https://opensky-network.org",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/adsb/, "/api/states/all")
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBiYXNlOiBcIi4vXCIsXG4gIHNlcnZlcjoge1xuICAgIGhvc3Q6IHRydWUsXG4gICAgcHJveHk6IHtcbiAgICAgICcvYWRzYi1wcm94eSc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgwJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYWRzYi1wcm94eS8sICcnKVxuICAgICAgfSxcbiAgICAgICcvYXBpL3dlYXRoZXInOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHBzOi8vYXBpLm1ldC5ubycsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHtcbiAgICAgICAgICBjb25zdCB1cmwgPSBuZXcgVVJMKHBhdGgsICdodHRwOi8vbG9jYWxob3N0Jyk7XG4gICAgICAgICAgY29uc3QgbGF0ID0gdXJsLnNlYXJjaFBhcmFtcy5nZXQoJ2xhdCcpO1xuICAgICAgICAgIGNvbnN0IGxvbiA9IHVybC5zZWFyY2hQYXJhbXMuZ2V0KCdsb24nKTtcbiAgICAgICAgICByZXR1cm4gYC93ZWF0aGVyYXBpL2xvY2F0aW9uZm9yZWNhc3QvMi4wL2NvbXBhY3Q/bGF0PSR7bGF0fSZsb249JHtsb259YDtcbiAgICAgICAgfSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdVc2VyLUFnZW50JzogJ01pbFVBUy1EYXNoYm9hcmQvMS4wIChjb250YWN0QGV4YW1wbGUuY29tKSdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICcvYXBpL2F2aWF0aW9uJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5tZXQubm8nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiB7XG4gICAgICAgICAgY29uc3QgdXJsID0gbmV3IFVSTChwYXRoLCAnaHR0cDovL2xvY2FsaG9zdCcpO1xuICAgICAgICAgIGNvbnN0IGljYW8gPSB1cmwuc2VhcmNoUGFyYW1zLmdldCgnaWNhbycpO1xuICAgICAgICAgIHJldHVybiBgL3dlYXRoZXJhcGkvdGFmbWV0YXIvMS4wL3RhZm1ldGFyLnR4dD9pY2FvPSR7aWNhb31gO1xuICAgICAgICB9LFxuICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgJ1VzZXItQWdlbnQnOiAnTWlsVUFTLURhc2hib2FyZC8xLjAgKGNvbnRhY3RAZXhhbXBsZS5jb20pJ1xuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgJy9hcGkvYWRzYic6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly9vcGVuc2t5LW5ldHdvcmsub3JnJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvYXBpXFwvYWRzYi8sICcvYXBpL3N0YXRlcy9hbGwnKVxuICAgICAgfVxuICAgIH1cbiAgfVxufSkiXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLEVBQ04sUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGlCQUFpQixFQUFFO0FBQUEsTUFDckQ7QUFBQSxNQUNBLGdCQUFnQjtBQUFBLFFBQ2QsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVM7QUFDakIsZ0JBQU0sTUFBTSxJQUFJLElBQUksTUFBTSxrQkFBa0I7QUFDNUMsZ0JBQU0sTUFBTSxJQUFJLGFBQWEsSUFBSSxLQUFLO0FBQ3RDLGdCQUFNLE1BQU0sSUFBSSxhQUFhLElBQUksS0FBSztBQUN0QyxpQkFBTyxnREFBZ0QsR0FBRyxRQUFRLEdBQUc7QUFBQSxRQUN2RTtBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsaUJBQWlCO0FBQUEsUUFDZixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUztBQUNqQixnQkFBTSxNQUFNLElBQUksSUFBSSxNQUFNLGtCQUFrQjtBQUM1QyxnQkFBTSxPQUFPLElBQUksYUFBYSxJQUFJLE1BQU07QUFDeEMsaUJBQU8sOENBQThDLElBQUk7QUFBQSxRQUMzRDtBQUFBLFFBQ0EsU0FBUztBQUFBLFVBQ1AsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsYUFBYTtBQUFBLFFBQ1gsUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLFFBQ2QsU0FBUyxDQUFDLFNBQVMsS0FBSyxRQUFRLGdCQUFnQixpQkFBaUI7QUFBQSxNQUNuRTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
