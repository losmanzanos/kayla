#!/usr/bin/env node
/**
 * serve.mjs — tiny zero-dependency static server for local preview.
 * Serves the repo root with "pretty URL" support (/about/ → /about/index.html),
 * mirroring how Cloudflare Pages serves the site. Run: `npm run serve`.
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = process.env.PORT || 3000;

const TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".ico": "image/x-icon",
  ".xml": "application/xml", ".txt": "text/plain", ".woff2": "font/woff2",
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split("?")[0]);
  let filePath = path.join(ROOT, urlPath);

  // Prevent path traversal
  if (!filePath.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }

  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }
    if (!fs.existsSync(filePath)) {
      const notFound = path.join(ROOT, "404.html");
      const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : "Not found";
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" }).end(body);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": TYPES[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(500).end("Server error");
  }
});

server.listen(PORT, () => {
  console.log(`\n  Mariposa preview running →  http://localhost:${PORT}\n  (Ctrl+C to stop)\n`);
});
