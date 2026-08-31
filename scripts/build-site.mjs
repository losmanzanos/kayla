#!/usr/bin/env node
/**
 * build-site.mjs — injects editable "Site Info" (content/settings/site.json)
 * into every built HTML page: visible NAP text, tel:/mailto: links, JSON-LD,
 * and Google Maps links. Repeatable: it records the last-applied display
 * values in scripts/applied-nap.json so it can find and update them next run.
 *
 * Run AFTER build-blog (so generated blog pages get updated too):
 *   npm run build      (runs build-blog then build-site)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const settings = JSON.parse(fs.readFileSync(path.join(ROOT, "content/settings/site.json"), "utf8"));
const appliedPath = path.join(ROOT, "scripts/applied-nap.json");
const applied = JSON.parse(fs.readFileSync(appliedPath, "utf8"));

// --- derived values ---
const digits = (settings.phone || "").replace(/[^0-9]/g, "");
const phoneTel = "+1" + digits.replace(/^1/, "");
const cityStateZip = `${settings.city}, ${settings.state} ${settings.zip}`;
const streetNoComma = settings.streetAddress.replace(/,/g, "");
const mapsQuery = encodeURIComponent(`${settings.streetAddress}, ${cityStateZip}`).replace(/%20/g, "+");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const jsonStr = (s) => s.replace(/"/g, '\\"');

function collectHtml(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === ".git" || e.name === "node_modules") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(collectHtml(p));
    else if (e.name.endsWith(".html")) out.push(p);
  }
  return out;
}

let changed = 0;
for (const file of collectHtml(ROOT)) {
  let s = fs.readFileSync(file, "utf8");
  const before = s;

  // 1) Visible display text (old applied value -> new)
  if (applied.phoneDisplay) s = s.split(applied.phoneDisplay).join(settings.phone);
  if (applied.emailDisplay) s = s.split(applied.emailDisplay).join(settings.email);
  for (const v of (applied.addrVariants || [])) s = s.split(v).join(settings.streetAddress);
  if (applied.cityzipDisplay) s = s.split(applied.cityzipDisplay).join(cityStateZip);

  // 2) Links (context-safe regex, no old value needed)
  s = s.replace(/tel:\+?\d{10,}/g, "tel:" + phoneTel);              // leaves tel:988 / tel:911 alone
  s = s.replace(/mailto:[^"'>\s]+/g, "mailto:" + settings.email);

  // 3) JSON-LD structured data
  s = s.replace(/"telephone":"[^"]*"/g, `"telephone":"${jsonStr(settings.phone)}"`);
  s = s.replace(/"email":"[^"]*"/g, `"email":"${jsonStr(settings.email)}"`);
  s = s.replace(/"streetAddress":"[^"]*"/g, `"streetAddress":"${jsonStr(streetNoComma)}"`);
  s = s.replace(/"addressLocality":"[^"]*"/g, `"addressLocality":"${jsonStr(settings.city)}"`);
  s = s.replace(/"addressRegion":"[^"]*"/g, `"addressRegion":"${jsonStr(settings.state)}"`);
  s = s.replace(/"postalCode":"[^"]*"/g, `"postalCode":"${jsonStr(settings.zip)}"`);

  // 4) Google Maps links
  s = s.replace(/(maps\.google\.com\/\?q=)[^"'&]+/g, `$1${mapsQuery}`);

  // 5) Instagram handle
  s = s.replace(/instagram\.com\/[A-Za-z0-9_.]+/g, "instagram.com/" + settings.instagram);
  s = s.replace(/@[A-Za-z0-9_.]*mariposamentalwellness[A-Za-z0-9_.]*/g, "@" + settings.instagram);

  if (s !== before) { fs.writeFileSync(file, s); changed++; }
}

// record what we just applied so the next run can find these values
fs.writeFileSync(appliedPath, JSON.stringify({
  phoneDisplay: settings.phone,
  emailDisplay: settings.email,
  addrVariants: [settings.streetAddress],
  cityzipDisplay: cityStateZip,
}, null, 2) + "\n");

console.log(`✓ Site info injected into ${changed} page(s).`);
console.log(`   phone ${settings.phone} · ${phoneTel} | email ${settings.email}`);
console.log(`   ${settings.streetAddress}, ${cityStateZip}`);
