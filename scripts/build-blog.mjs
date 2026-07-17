#!/usr/bin/env node
/**
 * build-blog.mjs — renders /content/posts/*.md into static HTML under /blog/.
 * Zero framework: the output is plain HTML that any static host (Cloudflare
 * Pages, GitHub Pages) serves directly. Run: `npm run blog`.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const POSTS_DIR = path.join(ROOT, "content", "posts");
const BLOG_DIR = path.join(ROOT, "blog");
const SITE = "https://mariposamentalwellness.com";

marked.setOptions({ mangle: false, headerIds: true });

/* ---------- shared chrome ---------- */
const BUTTERFLY = `<svg width="32" height="24" viewBox="0 0 64 48" fill="none" aria-hidden="true"><path d="M32 24 C29 17 22 8 13 5 C7 3 2 6 2 12 C2 18 10 23 32 24 Z" fill="none" stroke="#7C6A0A" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 24 C25 28 15 36 13 43 C11 48 17 49 22 45 C27 41 31 33 32 24 Z" fill="none" stroke="#7C6A0A" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 24 C35 17 42 8 51 5 C57 3 62 6 62 12 C62 18 54 23 32 24 Z" fill="none" stroke="#7C6A0A" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M32 24 C39 28 49 36 51 43 C53 48 47 49 42 45 C37 41 33 33 32 24 Z" fill="none" stroke="#7C6A0A" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="32" cy="24" rx="2" ry="10" fill="#7C6A0A"/><path d="M31 14 C29 9 25 5 22 2" stroke="#7C6A0A" stroke-width="1.6" stroke-linecap="round"/><path d="M33 14 C35 9 39 5 42 2" stroke="#7C6A0A" stroke-width="1.6" stroke-linecap="round"/><circle cx="22" cy="2" r="2" fill="#7C6A0A"/><circle cx="42" cy="2" r="2" fill="#7C6A0A"/></svg>`;

const nav = (r) => `<nav>
  <a href="/" class="nav-logo">${BUTTERFLY}<div class="nav-logo-text">Mariposa Mental Wellness<span>Kayla Martinez, MS, LPC</span></div></a>
  <ul class="nav-links">
    <li><a href="/">Home</a></li>
    <li><a href="/about/">About</a></li>
    <li class="nav-has-dropdown"><a href="/services/">Services</a>
      <ul class="nav-dropdown">
        <li><a href="/services/">All Services</a></li>
        <li><a href="/trauma-therapy-mesa-az/">Trauma Therapy</a></li>
        <li><a href="/ifs-therapy-mesa-az/">IFS Therapy</a></li>
        <li><a href="/emdr-therapy-mesa-az/">EMDR Therapy</a></li>
      </ul>
    </li>
    <li><a href="/therapy-for-mothers-mesa-az/">For Mothers</a></li>
    <li><a href="/blog/" class="active">Blog</a></li>
    <li><a href="/faq/">FAQ</a></li>
    <li><a href="/contact/" class="nav-cta">Book Now</a></li>
  </ul>
  <button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false"><span></span><span></span><span></span></button>
</nav>
<div class="mobile-menu" id="mobile-menu" aria-hidden="true">
  <div class="mobile-menu-brand">${BUTTERFLY}<p class="mobile-menu-brand-name">Mariposa Mental Wellness</p><p class="mobile-menu-brand-sub">Kayla Martinez, MS, LPC</p></div>
  <a href="/">Home</a>
  <a href="/about/">About</a>
  <a href="/services/">Services</a>
  <div class="mobile-subnav">
    <a href="/services/">All Services</a>
    <a href="/trauma-therapy-mesa-az/">Trauma Therapy</a>
    <a href="/ifs-therapy-mesa-az/">IFS Therapy</a>
    <a href="/emdr-therapy-mesa-az/">EMDR Therapy</a>
  </div>
  <a href="/therapy-for-mothers-mesa-az/">For Mothers</a>
  <a href="/blog/" class="active">Blog</a>
  <a href="/faq/">FAQ</a>
  <a href="/contact/" class="m-cta">Book a Consultation</a>
</div>`;

const footer = () => `<footer>
  <div class="footer-inner">
    <div>
      <div class="footer-logo">${BUTTERFLY}Mariposa Mental Wellness</div>
      <p>Trauma-informed therapy for women navigating anxiety, PTSD, perfectionism, and the quiet work of becoming themselves again.</p>
      <p style="margin-top:14px;">Kayla Martinez, MS, LPC &middot; LPC-24196<br>Licensed in Arizona</p>
      <p style="margin-top:14px;"><a href="https://www.instagram.com/mariposamentalwellness" target="_blank" rel="noopener" style="color:var(--amber);">@mariposamentalwellness</a></p>
    </div>
    <div class="footer-col"><h5>Navigate</h5><ul><li><a href="/">Home</a></li><li><a href="/about/">About Kayla</a></li><li><a href="/services/">Services</a></li><li><a href="/therapy-for-mothers-mesa-az/">For Mothers</a></li><li><a href="/blog/">Blog</a></li><li><a href="/faq/">FAQ</a></li><li><a href="/contact/">Contact</a></li></ul></div>
    <div class="footer-col"><h5>Get In Touch</h5><ul><li><a href="tel:+14806050846">(480) 605-0846</a></li><li><a href="/contact/">Send a message</a></li><li><a href="/contact/">Free 15-min consultation</a></li></ul><h5 style="margin-top:28px;">Location</h5><ul><li><a href="https://maps.google.com/?q=1845+S+Dobson+Rd+Suite+101+Mesa+AZ" target="_blank" rel="noopener">1845 S Dobson Rd, Ste 101</a></li><li><a href="https://maps.google.com/?q=1845+S+Dobson+Rd+Suite+101+Mesa+AZ" target="_blank" rel="noopener">Mesa, AZ 85202</a></li><li><a href="/contact/">Virtual &mdash; All of AZ</a></li></ul></div>
  </div>
  <div class="footer-bottom"><span>&copy; 2026 Mariposa Mental Wellness &middot; Kayla Martinez, MS, LPC</span><span>For emergencies call <a href="tel:988">988</a> or 911.</span></div>
</footer>`;

const head = (r, { title, desc, canonical, image, jsonld }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="${r}favicon.ico?v=5" sizes="any">
<link rel="icon" href="${r}favicon-192.png?v=5" type="image/png">
<link rel="apple-touch-icon" href="${r}apple-touch-icon.png?v=5">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${jsonld && jsonld["@type"] === "BlogPosting" ? "article" : "website"}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>` : ""}
<link rel="stylesheet" href="${r}css/style.css">
</head>
<body>
<a href="#main" class="skip-link">Skip to main content</a>
${nav(r)}
<main id="main">`;

const tail = (r) => `</main>
${footer()}
<script src="${r}js/main.js"></script>
</body>
</html>`;

/* ---------- helpers ---------- */
function esc(s = "") { return String(s).replace(/"/g, "&quot;"); }
function fmtDate(d) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function abs(r, src) {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  return r + src.replace(/^\//, "");
}

/* ---------- read posts ---------- */
if (!fs.existsSync(POSTS_DIR)) { console.error("No content/posts directory."); process.exit(1); }
const posts = fs.readdirSync(POSTS_DIR)
  .filter((f) => f.endsWith(".md"))
  .map((f) => {
    const slug = f.replace(/\.md$/, "");
    const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, f), "utf8"));
    return { slug, data, html: marked.parse(content) };
  })
  .filter((p) => p.data.published !== false)
  .sort((a, b) => new Date(b.data.date) - new Date(a.data.date));

fs.mkdirSync(BLOG_DIR, { recursive: true });

/* ---------- blog index ---------- */
{
  const r = "../";
  const cards = posts.map((p) => {
    const img = abs(r, p.data.image || "/images/journal.jpg");
    return `<a class="blog-card" href="/blog/${p.slug}/">
      <div class="blog-card-img"><img src="${img}" alt="${esc(p.data.title)}" loading="lazy"></div>
      <div class="blog-card-body">
        <div class="post-meta">${fmtDate(p.data.date)}${p.data.tags?.length ? ` &middot; ${esc(p.data.tags[0])}` : ""}</div>
        <h3>${esc(p.data.title)}</h3>
        <p>${esc(p.data.excerpt || "")}</p>
        <span class="blog-card-more">Read more &rarr;</span>
      </div>
    </a>`;
  }).join("\n");

  const jsonld = {
    "@context": "https://schema.org", "@type": "Blog",
    name: "Mariposa Mental Wellness Blog",
    url: `${SITE}/blog/`,
    author: { "@type": "Person", name: "Kayla Martinez" },
    blogPost: posts.map((p) => ({ "@type": "BlogPosting", headline: p.data.title, url: `${SITE}/blog/${p.slug}/`, datePublished: new Date(p.data.date).toISOString() })),
  };

  const body = `<section class="page-hero hero-blog">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="/">Home</a><span>/</span>Blog</div>
    <h1 class="reveal">Notes on <em>Healing</em></h1>
    <p class="reveal">Honest writing on anxiety, trauma, IFS, perfectionism, and the messy middle of becoming yourself.</p>
  </div>
</section>
<section style="background:var(--cream);">
  <div class="section">
    <div class="blog-grid">${cards || '<p class="body-text">New posts are on the way.</p>'}</div>
  </div>
</section>
<div class="cta-band">
  <h2>Prefer to talk it through <em>in person?</em></h2>
  <p>A free 15-minute consultation is the first step. No pressure &mdash; just a conversation.</p>
  <div class="cta-band-links"><a href="/contact/" class="btn-white">Book a Consultation</a></div>
</div>`;

  const page = head(r, {
    title: "Blog | Mariposa Mental Wellness — Therapy Notes, Mesa AZ",
    desc: "Honest, practical writing from Kayla Martinez, MS, LPC on trauma, anxiety, perfectionism, IFS, and motherhood — from her Mesa, AZ therapy practice.",
    canonical: `${SITE}/blog/`,
    image: `${SITE}/images/journal.jpg`, jsonld,
  }) + body + tail(r);
  fs.writeFileSync(path.join(BLOG_DIR, "index.html"), page);
}

/* ---------- individual posts ---------- */
for (const p of posts) {
  const r = "../../";
  const dir = path.join(BLOG_DIR, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  const img = abs(r, p.data.image || "/images/journal.jpg");
  const canonical = `${SITE}/blog/${p.slug}/`;

  const jsonld = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: p.data.title,
    description: p.data.excerpt || "",
    image: `${SITE}${(p.data.image || "/images/journal.jpg").replace(/^(?!\/)/, "/")}`,
    datePublished: new Date(p.data.date).toISOString(),
    author: { "@type": "Person", name: p.data.author || "Kayla Martinez" },
    publisher: { "@type": "Organization", name: "Mariposa Mental Wellness" },
    mainEntityOfPage: canonical,
  };

  const body = `<section class="page-hero hero-blog">
  <div class="page-hero-inner">
    <div class="breadcrumb"><a href="/">Home</a><span>/</span><a href="/blog/">Blog</a><span>/</span>Article</div>
    <h1 class="reveal">${esc(p.data.title)}</h1>
    <p class="reveal">${fmtDate(p.data.date)} &middot; ${esc(p.data.author || "Kayla Martinez, MS, LPC")}</p>
  </div>
</section>
<section style="background:white;">
  <div class="section post-wrap">
    <img class="post-hero-img" src="${img}" alt="${esc(p.data.title)}">
    <article class="post-body">${p.html}</article>
    <div class="post-tags">${(p.data.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
    <a href="/blog/" class="btn-outline" style="margin-top:20px;display:inline-block;">&larr; All Posts</a>
  </div>
</section>
<div class="cta-band">
  <h2>Ready to take <em>the first step?</em></h2>
  <p>A free 15-minute consultation is the first step. No pressure &mdash; just a conversation.</p>
  <div class="cta-band-links"><a href="/contact/" class="btn-white">Book a Consultation</a><a href="/services/" class="btn-outline" style="border-color:rgba(255,255,255,0.5);color:white;">Explore Services</a></div>
</div>`;

  const page = head(r, {
    title: `${p.data.title} | Mariposa Mental Wellness`,
    desc: p.data.excerpt || p.data.title,
    canonical, image: `${SITE}${(p.data.image || "/images/journal.jpg")}`, jsonld,
  }) + body + tail(r);
  fs.writeFileSync(path.join(dir, "index.html"), page);
}

console.log(`✓ Blog built: ${posts.length} post(s) → /blog/`);
posts.forEach((p) => console.log(`   • /blog/${p.slug}/`));
