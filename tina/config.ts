import { defineConfig } from "tinacms";

/**
 * TinaCMS configuration for Mariposa Mental Wellness.
 *
 * LOCAL EDITING (no account needed):
 *   npm install
 *   npm run tina        → opens the site + CMS at http://localhost:3000/admin
 *   Edits are written straight to markdown files in /content/posts.
 *   After editing, run `npm run blog` to regenerate the static /blog/ pages.
 *
 * GOING LIVE (so Kayla can edit from anywhere):
 *   Create a free project at https://app.tina.io, then set these env vars in
 *   Cloudflare Pages (and a local .env): NEXT_PUBLIC_TINA_CLIENT_ID and TINA_TOKEN.
 */
export default defineConfig({
  branch: process.env.TINA_BRANCH || process.env.CF_PAGES_BRANCH || "main",
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID || null, // from app.tina.io (optional for local)
  token: process.env.TINA_TOKEN || null,                    // from app.tina.io (optional for local)

  build: {
    outputFolder: "admin", // admin SPA served at /admin
    publicFolder: ".",     // site root
  },
  media: {
    tina: {
      mediaRoot: "images/uploads", // every upload from the editor lands in /images/uploads
      publicFolder: ".",
    },
  },

  schema: {
    collections: [
      {
        name: "post",
        label: "Blog Posts",
        path: "content/posts",
        format: "md",
        ui: {
          router: ({ document }) => `/blog/${document._sys.filename}/`,
          filename: {
            // auto-slug from the title
            slugify: (values) =>
              (values?.title || "untitled")
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, ""),
          },
        },
        fields: [
          { type: "string", name: "title", label: "Title", isTitle: true, required: true },
          { type: "datetime", name: "date", label: "Publish Date", required: true },
          { type: "boolean", name: "published", label: "Published", description: "Uncheck to keep as a draft (won't appear on the site).", },
          { type: "string", name: "excerpt", label: "Excerpt / Summary", ui: { component: "textarea" }, description: "1–2 sentences shown on the blog index and in search results.", },
          { type: "image", name: "image", label: "Hero Image" },
          { type: "string", name: "imageAlt", label: "Image description", description: "One plain sentence describing the photo, for screen readers and Google. Example: Folded linens stacked on a wooden crate." },
          { type: "string", name: "tags", label: "Tags", list: true },
          { type: "string", name: "author", label: "Author" },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },
      {
        name: "photos",
        label: "Site Photos",
        path: "content/settings",
        format: "json",
        // One always-present record: swap any photo, save, and the site updates on the next publish.
        ui: { global: true, allowedActions: { create: false, delete: false } },
        match: { include: "photos" },
        fields: [
          { type: "image", name: "homeHero", label: "Home: top photo (computer)", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "homeHeroMobile", label: "Home: top photo (phones)", description: "Tall (portrait) photo, at least 800px across. Keep the main subject in the top third; the text sits over the bottom." },
          { type: "image", name: "aboutHero", label: "About: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "servicesHero", label: "Services: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "womenHero", label: "For Women: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "traumaHero", label: "Trauma Therapy: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "ifsHero", label: "IFS Therapy: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "emdrHero", label: "EMDR Therapy: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "faqHero", label: "FAQ: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "contactHero", label: "Contact: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "blogHero", label: "Blog: top photo", description: "Wide (landscape) photo, at least 1600px across. The headline sits on the left, so keep the main subject on the right half." },
          { type: "image", name: "kaylaPortrait", label: "Your portrait (About page)", description: "Portrait (tall) photo of you, at least 1000px across." },
          { type: "image", name: "kaylaCandid", label: "Your candid photo (Home and About)", description: "A relaxed photo of you, wide or square, at least 1200px across." },
          { type: "image", name: "womenIntro", label: "For Women: photo beside the intro", description: "Tall or square photo, at least 800px across." },
          { type: "image", name: "mothersSection", label: "For Women: photo in the For Mothers section", description: "Tall or square photo, at least 800px across." },
        ],
      },
      {
        name: "settings",
        label: "Site Info",
        path: "content/settings",
        format: "json",
        // A single, always-present record: no creating or deleting extra ones.
        ui: { global: true, allowedActions: { create: false, delete: false } },
        match: { include: "site" },
        fields: [
          { type: "string", name: "phone", label: "Phone number", description: "As shown on the site, e.g. (480) 555-1234." },
          { type: "string", name: "email", label: "Contact email", description: "Where the contact form and 'Email' link point." },
          { type: "string", name: "streetAddress", label: "Street address", description: "e.g. 123 W Main St, Suite 200. Leave this blank until you have an office: while it is blank, the site hides the address and map and says sessions are virtual. Fill it in and the address, map, and in-person wording come back." },
          { type: "string", name: "city", label: "City" },
          { type: "string", name: "state", label: "State", description: "Two-letter, e.g. AZ." },
          { type: "string", name: "zip", label: "ZIP code" },
          { type: "string", name: "instagram", label: "Instagram handle", description: "Without the @." },
        ],
      },
    ],
  },
});
