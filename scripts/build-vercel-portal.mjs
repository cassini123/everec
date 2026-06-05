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

run("npm run build:vercel-api");
run("npm run build:vercel-subapis");

run("npm run build --workspace=@simcut/web-frontend", {
  VITE_APP_BASE: "/apps/simcut/",
});
run("npm run build --workspace=@everec/web-frontend", {
  VITE_APP_BASE: "/apps/desound/",
});
run("npm run build --workspace=@everec/knowgo-frontend", {
  VITE_APP_BASE: "/apps/knowgo/",
});
run("npm run build --workspace=@everec/prerector-frontend", {
  VITE_APP_BASE: "/apps/prerector/",
});

run("npm run build --workspace=@everec/portal");

const apps = [
  { name: "simcut", src: "simcut/web/frontend/dist" },
  { name: "desound", src: "desound/web/frontend/dist" },
  { name: "knowgo", src: "knowgo/web/frontend/dist" },
  { name: "prerector", src: "prerector/web/frontend/dist" },
];

for (const app of apps) {
  const dest = path.join(portalDist, "apps", app.name);
  rmDir(dest);
  copyDir(path.join(root, app.src), dest);
}

console.log("\n=== Build complete ===");
console.log(`Portal static: ${portalDist}`);
console.log("API functions: api/index.js, api/knowgo/index.js, api/prerector/index.js");
