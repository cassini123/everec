import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["api/_entry.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "api/index.js",
  logLevel: "info",
});
