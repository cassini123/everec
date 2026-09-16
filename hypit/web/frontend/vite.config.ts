import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const appBase = process.env.VITE_APP_BASE ?? "/apps/hypit/";

export default defineConfig({
  base: appBase,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "redirect-root-to-app-base",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const url = req.url ?? "/";
          if (url === "/" || url === "/index.html") {
            res.writeHead(302, { Location: `${appBase}index.html` });
            res.end();
            return;
          }
          next();
        });
      },
    },
  ],
  clearScreen: false,
  server: {
    port: 1424,
    strictPort: true,
  },
  build: {
    target: "es2021",
    outDir: "dist",
    emptyOutDir: true,
  },
});
