import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  { entry: "knowgo/index.ts", outfile: "knowgo/index.js", external: ["better-sqlite3"] },
  { entry: "prerector/index.ts", outfile: "prerector/index.js", external: [] },
];

for (const target of targets) {
  await esbuild.build({
    entryPoints: [path.join(root, target.entry)],
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    outfile: path.join(root, target.outfile),
    external: target.external,
    logLevel: "info",
  });
}
