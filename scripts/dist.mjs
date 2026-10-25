#!/usr/bin/env node
/**
 * dist.mjs: copies only the public website into dist/ for Cloudflare Pages.
 *
 * Runs last in `npm run build`. Cloudflare's output directory is `dist`, so
 * node_modules, build scripts, Tina source, editor content files, and anything
 * under work/ (other previews) never get published.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "dist");

const SKIP = new Set([
  ".git", ".github", "node_modules", "dist", "work", "scripts", "content", "tina",
  "package.json", "package-lock.json", ".gitignore", ".DS_Store", ".nojekyll", ".env",
  "README.md", "README-LOCAL.md", "emailjs-template.html", "font-compare.html",
]);

fs.rmSync(OUT, { recursive: true, force: true });
let files = 0;
function copy(src, dest) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith("goldenhour-") || e.name === "fbc-update") continue;
    const s = path.join(src, e.name), d = path.join(dest, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copy(s, d); }
    else { fs.copyFileSync(s, d); files++; }
  }
}
fs.mkdirSync(OUT, { recursive: true });
copy(ROOT, OUT);

// Cache-bust: stamp every page's CSS/JS links with this build's version, so phones
// pick up design changes right away instead of holding yesterday's stylesheet.
const VER = (process.env.CF_PAGES_COMMIT_SHA || Date.now().toString(36)).slice(0, 8);
function stamp(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "admin") stamp(p); continue; }
    if (!e.name.endsWith(".html")) continue;
    const s = fs.readFileSync(p, "utf8");
    const out = s.replace(/((?:style\.css|main\.js|form\.js))(?:\?v=[^"'&]*)?(["'])/g, `$1?v=${VER}$2`);
    if (out !== s) fs.writeFileSync(p, out);
  }
}
stamp(OUT);
console.log(`dist/: ${files} files ready to publish.`);
