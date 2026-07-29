import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const isPreview = process.env.COZE_PREVIEW === "true";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  clearScreen: false,
  server: {
    port: 1410,
    strictPort: true,
    proxy: isPreview
      ? {
          // 预览模式下不代理 /apps/*，由 public/ 目录提供静态文件
          "/api/knowgo": {
            target: "http://localhost:3002",
            changeOrigin: true,
          },
          "/api": {
            target: "http://localhost:3001",
            changeOrigin: true,
          },
          "/api/prerector": {
            target: "http://localhost:3003",
            changeOrigin: true,
          },
        }
      : {
          "/api/knowgo": {
            target: "http://localhost:3002",
            changeOrigin: true,
          },
          "/api": {
            target: "http://localhost:3001",
            changeOrigin: true,
          },
          "/apps/simcut": {
            target: "http://localhost:1421",
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/apps\/simcut/, ""),
          },
          "/apps/desound": {
            target: "http://localhost:1420",
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/apps\/desound/, ""),
          },
          "/apps/knowgo": {
            target: "http://localhost:1422",
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/apps\/knowgo/, ""),
          },
          "/apps/prerector": {
            target: "http://localhost:1423",
            changeOrigin: true,
            rewrite: (p) => p.replace(/^\/apps\/prerector/, ""),
          },
          "/api/prerector": {
            target: "http://localhost:3003",
            changeOrigin: true,
          },
        },
  },
  build: {
    target: "es2021",
    outDir: "dist",
    emptyOutDir: true,
  },
});
