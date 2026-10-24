#!/usr/bin/env node
/**
 * build-photos.mjs: applies the editable "Site Photos" (content/settings/photos.json)
 * to the stylesheet and every HTML page.
 *
 * Each photo slot has one unique file path. This script swaps the last-applied
 * path for the current one everywhere it appears (CSS backgrounds, <img> tags,
 * preload hints, structured data). It records what it applied in
 * scripts/applied-photos.json so the next run can find those paths again.
 *
 * Runs as part of `npm run build`, after build-blog.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const photosPath = path.join(ROOT, "content/settings/photos.json");
const appliedPath = path.join(ROOT, "scripts/applied-photos.json");

const photos = JSON.parse(fs.readFileSync(photosPath, "utf8"));
const applied = fs.existsSync(appliedPath) ? JSON.parse(fs.readFileSync(appliedPath, "utf8")) : { ...photos };

// "/images/x.jpg" -> "images/x.jpg" so it matches both "images/..." and "../images/..." references
const rel = (p) => String(p || "").replace(/^\/+/, "");

function collect(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "admin", "content", "tina"].includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(collect(p));
    else if (e.name.endsWith(".html") || e.name === "style.css") out.push(p);
  }
  return out;
}

const swaps = Object.keys(photos)
  .filter((k) => photos[k] && applied[k] && rel(photos[k]) !== rel(applied[k]))
  .map((k) => [rel(applied[k]), rel(photos[k]), k]);

let changed = 0;
if (swaps.length) {
  for (const file of collect(ROOT)) {
    let s = fs.readFileSync(file, "utf8");
    const before = s;
    for (const [from, to] of swaps) s = s.split(from).join(to);
    if (s !== before) { fs.writeFileSync(file, s); changed++; }
  }
}

fs.writeFileSync(appliedPath, JSON.stringify(photos, null, 2) + "\n");
console.log(`Site photos: ${swaps.length} swapped, ${changed} file(s) updated.`);
swaps.forEach(([from, to, k]) => console.log(`   ${k}: ${from} -> ${to}`));
