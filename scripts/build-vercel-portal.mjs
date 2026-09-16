import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const portalDist = path.join(root, "portal/dist");

function run(cmd, env = {}) {
  console.log(`\n> ${cmd}`);
  execSync(cmd, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function rmDir(dir) {
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

console.log("=== Everec unified Vercel build ===");

// Nested api/* bundles are served as static files on Vercel — only api/index.js is a function
for (const sub of ["knowgo", "prerector"]) {
  rmDir(path.join(root, "api", sub));
}

run("pnpm run build:vercel-api");

run("pnpm --filter @simcut/web-frontend exec vite build", {
  VITE_APP_BASE: "/apps/simcut/",
});
run("pnpm --filter @everec/web-frontend exec vite build", {
  VITE_APP_BASE: "/apps/desound/",
});
run("pnpm --filter @everec/knowgo-frontend exec vite build", {
  VITE_APP_BASE: "/apps/knowgo/",
});
run("pnpm --filter @everec/prerector-frontend exec vite build", {
  VITE_APP_BASE: "/apps/prerector/",
});
run("pnpm --filter @everec/hypit-frontend exec vite build", {
  VITE_APP_BASE: "/apps/hypit/",
});

run("pnpm --filter @everec/portal exec vite build");

const apps = [
  { name: "simcut", src: "simcut/web/frontend/dist" },
  { name: "desound", src: "desound/web/frontend/dist" },
  { name: "knowgo", src: "knowgo/web/frontend/dist" },
  { name: "prerector", src: "prerector/web/frontend/dist" },
  { name: "hypit", src: "hypit/web/frontend/dist" },
];

for (const app of apps) {
  const dest = path.join(portalDist, "apps", app.name);
  rmDir(dest);
  copyDir(path.join(root, app.src), dest);
}

console.log("\n=== Build complete ===");
console.log(`Portal static: ${portalDist}`);
console.log("API function: api/index.js via api/_entry.ts (desound + knowgo + prerector)");
