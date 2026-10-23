#!/usr/bin/env node
/**
 * build-blog.mjs: renders /content/posts/*.md into static HTML under /blog/.
 * Renders posts to plain static HTML that any static host (Cloudflare
 * Pages, GitHub Pages) can serve directly. Run: `npm run blog`.
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
const BUTTERFLY = `<svg width="32" height="24" viewBox="0 0 64 48" fill="#7C6A0A" aria-hidden="true"><g fill-rule="evenodd"><path d="M30.9 21.2C28.4 13.9 22.4 6.3 13.2 2.9C8.3 1.1 3.9 1.9 2.8 5.1C1.8 8.1 3.7 12.8 7.9 16.6C12.6 20.8 21 23.3 30.5 24Z M28.6 20.2C23.3 14.6 16.8 9.4 9.4 6.4C16.9 10.4 23 15.4 27.7 21.1Z M27.9 22.4C21.6 19.6 14.2 17 7.6 12.4C13.8 17.6 20.8 20.9 27.3 23.3Z"/><path d="M30.5 25.8C24.6 26 17.7 28.4 14.5 33C11.5 37.4 12.4 43.3 16.7 44.3C21.8 45.5 27.7 38.5 31.1 28.2Z M29.3 27.6C24.7 29.8 19.7 34.3 16.5 40.3C20.3 35.2 25.1 30.8 29.7 28.6Z"/><path d="M31.3 12.6C30.3 8.3 28 4.6 24.8 2.3" fill="none" stroke="#7C6A0A" stroke-width="1" stroke-linecap="round"/><circle cx="24.5" cy="2.2" r="1.1"/></g><g fill-rule="evenodd" transform="matrix(-1 0 0 1 64 0)"><path d="M30.9 21.2C28.4 13.9 22.4 6.3 13.2 2.9C8.3 1.1 3.9 1.9 2.8 5.1C1.8 8.1 3.7 12.8 7.9 16.6C12.6 20.8 21 23.3 30.5 24Z M28.6 20.2C23.3 14.6 16.8 9.4 9.4 6.4C16.9 10.4 23 15.4 27.7 21.1Z M27.9 22.4C21.6 19.6 14.2 17 7.6 12.4C13.8 17.6 20.8 20.9 27.3 23.3Z"/><path d="M30.5 25.8C24.6 26 17.7 28.4 14.5 33C11.5 37.4 12.4 43.3 16.7 44.3C21.8 45.5 27.7 38.5 31.1 28.2Z M29.3 27.6C24.7 29.8 19.7 34.3 16.5 40.3C20.3 35.2 25.1 30.8 29.7 28.6Z"/><path d="M31.3 12.6C30.3 8.3 28 4.6 24.8 2.3" fill="none" stroke="#7C6A0A" stroke-width="1" stroke-linecap="round"/><circle cx="24.5" cy="2.2" r="1.1"/></g><ellipse cx="32" cy="24.6" rx="1.5" ry="11.4"/><circle cx="32" cy="12.8" r="1.7"/></svg>`;

const nav = (r) => `<nav>
  <a href="/" class="nav-logo">${BUTTERFLY}<div class="nav-logo-text">Mariposa<span>Mental Wellness</span></div></a>
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
  <div class="mobile-menu-brand">${BUTTERFLY}<p class="mobile-menu-brand-name">Mariposa</p><p class="mobile-menu-brand-sub">Mental Wellness &middot; Kayla Martinez, LPC</p></div>
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
      <p>Trauma-informed therapy for adults working through anxiety, PTSD, and perfectionism in Mesa, AZ.</p>
      <p style="margin-top:14px;">Kayla Martinez, MS, LPC &middot; LPC-24196<br>Licensed in Arizona</p>
      <p style="margin-top:14px;"><a href="https://www.instagram.com/mariposamentalwellness" target="_blank" rel="noopener" style="color:var(--amber);">@mariposamentalwellness</a></p>
    </div>
    <div class="footer-col"><h5>Pages</h5><ul><li><a href="/">Home</a></li><li><a href="/about/">About Kayla</a></li><li><a href="/services/">Services</a></li><li><a href="/therapy-for-mothers-mesa-az/">For Mothers</a></li><li><a href="/blog/">Blog</a></li><li><a href="/faq/">FAQ</a></li><li><a href="/contact/">Contact</a></li></ul></div>
    <div class="footer-col"><h5>Get In Touch</h5><ul><li><a href="tel:+14806050846">(480) 605-0846</a></li><li><a href="/contact/">Send a message</a></li><li><a href="/contact/">Free 15-min consultation</a></li></ul><h5 style="margin-top:28px;">Location</h5><ul><li><a href="https://maps.google.com/?q=1845+S+Dobson+Rd+Suite+101+Mesa+AZ" target="_blank" rel="noopener">1845 S Dobson Rd, Ste 101</a></li><li><a href="https://maps.google.com/?q=1845+S+Dobson+Rd+Suite+101+Mesa+AZ" target="_blank" rel="noopener">Mesa, AZ 85202</a></li><li><a href="/contact/">Virtual sessions, all of AZ</a></li></ul></div>
  </div>
  <div class="footer-bottom"><span>&copy; 2026 Mariposa Mental Wellness &middot; Kayla Martinez, MS, LPC</span><span>For emergencies call <a href="tel:988">988</a> or 911.</span><span class="site-credit">made with &hearts; by <a href="https://therapistweb.design" target="_blank" rel="noopener">chad</a></span></div>
</footer>`;

const head = (r, { title, desc, canonical, image, jsonld }) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="${r}favicon.ico?v=6" sizes="any">
<link rel="icon" href="${r}favicon-192.png?v=6" type="image/png">
<link rel="apple-touch-icon" href="${r}apple-touch-icon.png?v=6">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:type" content="${[].concat(jsonld || []).some((j) => j["@type"] === "BlogPosting") ? "article" : "website"}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${image}">
${[].concat(jsonld || []).map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join("\n")}
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
const DEFAULT_IMG = "/images/rd-blog.jpg";
function crumbs(list) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: list.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: SITE + url })) };
}
function pic(src, alt, attrs = "") {
  const local = src.replace(/^(\.\.\/)+/, "").split("?")[0];
  const webp = local.replace(/\.(jpg|jpeg|png)$/i, ".webp");
  const img = `<img src="${src}" alt="${esc(alt)}" ${attrs}>`;
  if (webp === local || !fs.existsSync(path.join(ROOT, webp))) return img;
  return `<picture><source srcset="${src.replace(/\.(jpg|jpeg|png)(\?.*)?$/i, ".webp")}" type="image/webp">${img}</picture>`;
}
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
    const img = abs(r, p.data.image || DEFAULT_IMG);
    return `<a class="blog-card" href="/blog/${p.slug}/">
      <div class="blog-card-img">${pic(img, p.data.imageAlt || p.data.title, 'loading="lazy"')}</div>
      <div class="blog-card-body">
        <div class="post-meta">${fmtDate(p.data.date)}${p.data.tags?.length ? ` &middot; ${esc(p.data.tags[0])}` : ""}</div>
        <h2>${esc(p.data.title)}</h2>
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
    <p class="reveal">Honest, practical writing on anxiety, trauma, IFS, perfectionism, and motherhood.</p>
  </div>
</section>
<section style="background:var(--cream);">
  <div class="section">
    <div class="blog-grid">${cards || '<p class="body-text">New posts are on the way.</p>'}</div>
  </div>
</section>
<div class="cta-band">
  <h2>Prefer to talk it through <em>in person?</em></h2>
  <p>A free 15-minute consultation is the first step. No pressure, just a conversation.</p>
  <div class="cta-band-links"><a href="/contact/" class="btn-white">Book a Consultation</a></div>
</div>`;

  const page = head(r, {
    title: "Blog | Mariposa Mental Wellness, Therapy Notes, Mesa AZ",
    desc: "Honest, practical writing from Kayla Martinez, MS, LPC on trauma, anxiety, perfectionism, IFS, and motherhood from her Mesa, AZ therapy practice.",
    canonical: `${SITE}/blog/`,
    image: `${SITE}/images/og/blog.jpg`, jsonld: [jsonld, crumbs([["Home", "/"], ["Blog", "/blog/"]])],
  }) + body + tail(r);
  fs.writeFileSync(path.join(BLOG_DIR, "index.html"), page);
}

/* ---------- individual posts ---------- */
for (const p of posts) {
  const r = "../../";
  const dir = path.join(BLOG_DIR, p.slug);
  fs.mkdirSync(dir, { recursive: true });
  const img = abs(r, p.data.image || DEFAULT_IMG);
  const ogLocal = `/images/og/post-${p.slug}.jpg`;
  const ogImg = SITE + (fs.existsSync(path.join(ROOT, ogLocal)) ? ogLocal : (p.data.image || DEFAULT_IMG));
  const canonical = `${SITE}/blog/${p.slug}/`;

  const jsonld = {
    "@context": "https://schema.org", "@type": "BlogPosting",
    headline: p.data.title,
    description: p.data.excerpt || "",
    image: ogImg,
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
    ${pic(img, p.data.imageAlt || p.data.title, 'class="post-hero-img"')}
    <article class="post-body">${p.html}</article>
    <div class="post-tags">${(p.data.tags || []).map((t) => `<span>${esc(t)}</span>`).join("")}</div>
    <a href="/blog/" class="btn-outline" style="margin-top:20px;display:inline-block;">&larr; All Posts</a>
  </div>
</section>
<div class="cta-band">
  <h2>Ready to take <em>the first step?</em></h2>
  <p>A free 15-minute consultation is the first step. No pressure, just a conversation.</p>
  <div class="cta-band-links"><a href="/contact/" class="btn-white">Book a Consultation</a><a href="/services/" class="btn-outline" style="border-color:rgba(255,255,255,0.5);color:white;">Explore Services</a></div>
</div>`;

  const page = head(r, {
    title: `${p.data.title} | Mariposa Mental Wellness`,
    desc: p.data.excerpt || p.data.title,
    canonical, image: ogImg, jsonld: [jsonld, crumbs([["Home", "/"], ["Blog", "/blog/"], [p.data.title, `/blog/${p.slug}/`]])],
  }) + body + tail(r);
  fs.writeFileSync(path.join(dir, "index.html"), page);
}

console.log(`Blog built: ${posts.length} post(s) → /blog/`);
posts.forEach((p) => console.log(`   • /blog/${p.slug}/`));
