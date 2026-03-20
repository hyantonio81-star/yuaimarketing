import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
      "/go": {
        target: "http://localhost:4000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/go/, "/api/go"),
      },
    },
  },
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  build: {
    chunkSizeWarningLimit: 1200
  }
});
