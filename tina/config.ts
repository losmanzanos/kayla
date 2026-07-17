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
      mediaRoot: "images/blog", // uploads land in /images/blog
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
          { type: "string", name: "tags", label: "Tags", list: true },
          { type: "string", name: "author", label: "Author" },
          { type: "rich-text", name: "body", label: "Body", isBody: true },
        ],
      },
    ],
  },
});
