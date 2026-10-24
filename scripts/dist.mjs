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
console.log(`dist/: ${files} files ready to publish.`);
