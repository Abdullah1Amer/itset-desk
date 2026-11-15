// Copies the Desk's shared business logic (SLA, assets, maintenance) next to the built server (dist/ or bundle/).
import { copyFileSync, chmodSync, existsSync } from "node:fs";
const here = new URL(".", import.meta.url);
const target = process.argv[2] === "bundle" ? "bundle" : "dist";
copyFileSync(new URL("../../public/core.js", here), new URL(`../${target}/core.cjs`, here));
const entry = new URL(target === "bundle" ? "../bundle/itset-desk-mcp.mjs" : "../dist/index.js", here);
if (existsSync(entry)) chmodSync(entry, 0o755);
console.error(`copied core.js → ${target}/core.cjs`);
