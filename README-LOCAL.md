# Mariposa Mental Wellness — Local Preview & Editing

Static site (hand-built HTML) + a TinaCMS-managed blog. Hosting target: **Cloudflare Pages**.

## Preview locally (fastest — no install needed)

The blog HTML is already generated and committed, so you can preview the whole site with nothing but Python:

```bash
cd mariposa-WORKING-SOURCE
python3 -m http.server 3000
```

Then open **http://localhost:3000** — check the home page, `/blog/`, `/contact/`, etc.

> Prefer Node? `npm install` then `npm run serve` does the same on port 3000.

## Preview with the CMS (so you can add/edit posts)

```bash
cd mariposa-WORKING-SOURCE
npm install            # first time only
npm run tina           # opens the site + CMS at http://localhost:3000/admin
```

Edit or add posts in the admin. Posts are saved as markdown in `content/posts/`.
After editing, regenerate the static blog pages:

```bash
npm run blog           # rebuilds /blog/index.html and each /blog/<slug>/
```

## Project map

| Path | What it is |
|------|-----------|
| `index.html`, `about/`, `services/`, … | Hand-built static pages |
| `content/posts/*.md` | Blog posts (edited via Tina or by hand) |
| `blog/` | **Generated** static blog HTML (do not edit by hand) |
| `scripts/build-blog.mjs` | Markdown → HTML generator |
| `tina/config.ts` | TinaCMS schema (the "Blog Posts" collection) |
| `js/form.js` | Contact-form handler (EmailJS) |
| `emailjs-template.html` | Paste into the EmailJS dashboard as the email template |
| `_headers`, `_redirects` | Cloudflare Pages config |

## Before it goes live — two keys to add

1. **EmailJS** (contact form): create a service + template at https://dashboard.emailjs.com, paste
   `emailjs-template.html` as the template, then fill the three IDs at the top of `js/form.js`.
   Until then the form shows a friendly "not connected yet" note instead of failing silently.
2. **TinaCMS Cloud** (optional — only needed for Kayla to edit from a browser without running commands):
   create a project at https://app.tina.io and set `NEXT_PUBLIC_TINA_CLIENT_ID` + `TINA_TOKEN`
   as environment variables in Cloudflare Pages. Local editing works without this.

## Deploy (Cloudflare Pages) — when approved

- Framework preset: **None** · Build command: `npm run build` · Output dir: `.`
- (Or, since the blog is pre-built, you can deploy with no build step at all.)
