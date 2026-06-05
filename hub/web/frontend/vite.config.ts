import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@everec/shared": path.resolve(__dirname, "../../../shared/src/index.ts"),
    },
  },
  clearScreen: false,
  server: {
    port: 1400,
    strictPort: true,
    proxy: {
      "/api/knowgo": {
        target: "http://localhost:3002",
        changeOrigin: true,
      },
      "/api/desound": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2021",
    outDir: "dist",
  },
});
