// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.mjs";
var vite_config_default = defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      "/api/weather": {
        target: "https://api.met.no",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/weather/, "/weatherapi/locationforecast/2.0/compact"),
        headers: {
          "User-Agent": "MilUAS-Dashboard/1.0 (contact@example.com)"
        }
      },
      "/api/aviation": {
        target: "https://api.met.no",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/aviation/, "/weatherapi/tafmetar/1.0/tafmetar.txt"),
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHJlYWN0IGZyb20gJ0B2aXRlanMvcGx1Z2luLXJlYWN0J1xuXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcbiAgcGx1Z2luczogW3JlYWN0KCldLFxuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiB0cnVlLFxuICAgIHByb3h5OiB7XG4gICAgICAnL2FwaS93ZWF0aGVyJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5tZXQubm8nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC93ZWF0aGVyLywgJy93ZWF0aGVyYXBpL2xvY2F0aW9uZm9yZWNhc3QvMi4wL2NvbXBhY3QnKSxcbiAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICdVc2VyLUFnZW50JzogJ01pbFVBUy1EYXNoYm9hcmQvMS4wIChjb250YWN0QGV4YW1wbGUuY29tKSdcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICcvYXBpL2F2aWF0aW9uJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL2FwaS5tZXQubm8nLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC9hdmlhdGlvbi8sICcvd2VhdGhlcmFwaS90YWZtZXRhci8xLjAvdGFmbWV0YXIudHh0JyksXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAnVXNlci1BZ2VudCc6ICdNaWxVQVMtRGFzaGJvYXJkLzEuMCAoY29udGFjdEBleGFtcGxlLmNvbSknXG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnL2FwaS9hZHNiJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwczovL29wZW5za3ktbmV0d29yay5vcmcnLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHJld3JpdGU6IChwYXRoKSA9PiBwYXRoLnJlcGxhY2UoL15cXC9hcGlcXC9hZHNiLywgJy9hcGkvc3RhdGVzL2FsbCcpXG4gICAgICB9XG4gICAgfVxuICB9XG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBeU4sU0FBUyxvQkFBb0I7QUFDdFAsT0FBTyxXQUFXO0FBR2xCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixPQUFPO0FBQUEsTUFDTCxnQkFBZ0I7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxtQkFBbUIsMENBQTBDO0FBQUEsUUFDN0YsU0FBUztBQUFBLFVBQ1AsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLE1BQ0EsaUJBQWlCO0FBQUEsUUFDZixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsb0JBQW9CLHVDQUF1QztBQUFBLFFBQzNGLFNBQVM7QUFBQSxVQUNQLGNBQWM7QUFBQSxRQUNoQjtBQUFBLE1BQ0Y7QUFBQSxNQUNBLGFBQWE7QUFBQSxRQUNYLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFNBQVMsQ0FBQyxTQUFTLEtBQUssUUFBUSxnQkFBZ0IsaUJBQWlCO0FBQUEsTUFDbkU7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
