#!/usr/bin/env node
/**
 * build-site.mjs: injects editable "Site Info" (content/settings/site.json)
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
const street = (settings.streetAddress || "").trim();
const hasOffice = street !== "";            // blank street = no office yet: hide address, map, in-person lines
const cityState = `${settings.city}, ${settings.state}`;
const cityStateZip = `${cityState} ${settings.zip}`.trim();
const fullAddress = hasOffice ? `${street}, ${cityStateZip}` : cityState;
const mapsQuery = encodeURIComponent(fullAddress).replace(/%20/g, "+");

// schema.org PostalAddress: street and ZIP only when there is an office
const postal = { "@type": "PostalAddress" };
if (hasOffice) postal.streetAddress = street.replace(/,/g, "");
postal.addressLocality = settings.city;
postal.addressRegion = settings.state;
if (hasOffice && settings.zip) postal.postalCode = settings.zip;
postal.addressCountry = "US";

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const jsonStr = (s) => s.replace(/"/g, '\\"');

function collectHtml(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "admin", "work", "emailjs-template.html"].includes(e.name)) continue;   // work/ holds other previews; the email template has its own {{placeholders}}
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(collectHtml(p));
    else if (e.name.endsWith(".html") || e.name === "llms.txt") out.push(p);
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

  // Address text lives in marked elements: <x data-site="street|cityzip|citystate|address">
  const siteVals = { street, cityzip: cityStateZip, citystate: cityState, address: fullAddress };
  s = s.replace(/(<([a-z0-9]+)\b[^>]*\bdata-site="(street|cityzip|citystate|address)"[^>]*>)[^<]*(<\/\2>)/g,
    (m, open, tag, key, close) => open + esc(siteVals[key]) + close);

  // Office on/off: show or hide blocks, and swap short lines of copy
  s = s.replace(/(<[a-z0-9]+\b[^>]*?\bdata-office-show="(on|off)")((?:\s+hidden)?)(?=[\s>])/g,
    (m, start, when) => start + ((when === "on") === hasOffice ? "" : " hidden"));
  s = s.replace(/(<([a-z0-9]+)\b[^>]*\bdata-office-text-on="([^"]*)"[^>]*\bdata-office-text-off="([^"]*)"[^>]*>)[^<]*(<\/\2>)/g,
    (m, open, tag, on, off, close) => open + (hasOffice ? on : off) + close);

  // llms.txt office line
  s = s.replace(/^Office: .*\. Phone: /m, hasOffice ? `Office: ${fullAddress}. Phone: ` : `Office: in-person location to be announced; sessions are virtual for now. Phone: `);

  // 2) Links (context-safe regex, no old value needed)
  s = s.replace(/tel:\+?\d{10,}/g, "tel:" + phoneTel);              // leaves tel:988 / tel:911 alone
  s = s.replace(/mailto:[^"'>\s]+/g, "mailto:" + settings.email);

  // 3) JSON-LD structured data
  s = s.replace(/"telephone":"[^"]*"/g, `"telephone":"${jsonStr(settings.phone)}"`);
  s = s.replace(/"email":"[^"]*"/g, `"email":"${jsonStr(settings.email)}"`);
  s = s.replace(/"address":\{"@type":"PostalAddress"[^}]*\}/g, `"address":${JSON.stringify(postal)}`);
  s = s.replace(/,"geo":\{[^}]*\}/g, "");   // fixed coordinates go stale when the address changes

  // 4) Google Maps links
  s = s.replace(/(maps\.google\.com\/\?q=)[^"'&]+/g, `$1${mapsQuery}`);
  s = s.replace(/(google\.com\/maps\?q=)[^"'&]+/g, `$1${mapsQuery}`);

  // 5) Instagram handle
  s = s.replace(/instagram\.com\/[A-Za-z0-9_.]+/g, "instagram.com/" + settings.instagram);
  s = s.replace(/@[A-Za-z0-9_.]*mariposamentalwellness[A-Za-z0-9_.]*/g, "@" + settings.instagram);

  if (s !== before) { fs.writeFileSync(file, s); changed++; }
}

// record what we just applied so the next run can find these values
fs.writeFileSync(appliedPath, JSON.stringify({
  phoneDisplay: settings.phone,
  emailDisplay: settings.email,
}, null, 2) + "\n");

console.log(`Site info injected into ${changed} page(s).`);
console.log(`   phone ${settings.phone} · ${phoneTel} | email ${settings.email}`);
console.log(`   ${hasOffice ? fullAddress : "no office yet (address and map hidden)"}`);
