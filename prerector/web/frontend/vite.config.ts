import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

export default defineConfig({
  base: process.env.VITE_APP_BASE ?? "/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@everec/shared": path.resolve(__dirname, "../../../shared/src/index.ts"),
    },
  },
  clearScreen: false,
  server: {
    port: 1423,
    strictPort: true,
    proxy: {
      "/api/prerector": {
        target: "http://localhost:3003",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "es2021",
    outDir: "dist",
  },
});
