# Blog Content Guide

This folder contains all blog articles as individual Markdown files. Add a new `.md` file here and it will automatically appear on the site.

## Quick Start

1) Create a file: `content/blog/my-post-slug.md`
2) Add frontmatter, then your Markdown content:

```md
---
slug: "my-post-slug"           # lowercase, dash-separated; must be unique
title: "My Post Title"
excerpt: "Optional short summary (auto-generated if omitted)."
date: "2026-01-15"             # ISO format: YYYY-MM-DD
tags: ["Cloud", "Architecture"]
author: "Ade A."
imageUrl: "https://…/hero.jpg"  # hero image at the top of the post + cards
imageAlt: "Short description of the image for accessibility"
---

# Heading 1

Your article content in Markdown…
```

That’s all — the site discovers new posts automatically.

## Frontmatter Fields

- slug: unique identifier and URL path (`/blog/slug`). The filename usually matches it.
- title: human-readable title shown on cards and the post page.
- excerpt (optional): if omitted, an excerpt is computed from the content.
- date: publication date in `YYYY-MM-DD`.
- tags: array of strings; used for the tag filter on the blog page.
- author: author’s display name.
- imageUrl: the hero image used in the list card and post header.
- imageAlt: short, descriptive alternative text for accessibility.

Read time is auto-computed; you can override via `readTime: "X min read"` if needed.

## Images

There are two kinds of images you might use:

1) Hero image (frontmatter `imageUrl`)
   - This uses Next.js image optimization and must be from an allowed domain or a local file.
   - Allowed remote hosts are configured in `next.config.js` under `images.remotePatterns`.
   - Currently allowed: `images.unsplash.com` and `images.contentstack.io`.
   - To use a different host for `imageUrl`, add it to `next.config.js`.

2) Inline images (inside your Markdown content)
   - Use standard Markdown syntax: `![alt text](/blog/my-image.png)`.
   - Local images: place files under `public/blog/` and reference with `/blog/<file>`.
   - Remote images: any URL is fine (these render as regular `<img>` tags).

### Local Image Tips

- Put images in `public/blog/` (or a subfolder):
  - Example: `public/blog/my-post/diagram.png` → `![diagram](/blog/my-post/diagram.png)`
- Keep reasonable dimensions for performance (e.g., ~1200×600 for hero-like visuals).
- Always supply meaningful `alt` text in Markdown for accessibility.

### Downloaded Images (Local) — Step‑by‑Step

Use this if you downloaded an image and want to store it in the repo.

1) Save the file under `public/blog/<your-slug>/` (create the folder if needed)
   - Example path: `public/blog/getting-started-elasticsearch/hero.png`
2) Reference it:
   - As the hero image (frontmatter):
     ```md
     imageUrl: "/blog/getting-started-elasticsearch/hero.png"
     imageAlt: "Concise description"
     ```
   - Inline in Markdown:
     ```md
     ![Concise description](/blog/getting-started-elasticsearch/diagram.png)
     ```
3) Tips for local files
   - No `next.config.js` change is needed for local images.
   - Prefer `.webp` or optimized `.jpg` when possible; keep sizes modest.
   - Use lowercase names, no spaces: `diagram-architecture.webp`.
   - Hero images (from `imageUrl`) are optimized with next/image.
   - Inline images render as standard `<img>` via Markdown.

## Markdown & Formatting

- GitHub Flavored Markdown (GFM) is supported (tables, task lists, strikethrough, etc.).
- Headings (`#`, `##`, `###`), lists, code blocks (```) and blockquotes are styled.
- Stick to Markdown; avoid raw HTML in posts.

## Pagination & Discovery

- Posts are auto-sorted by date (newest first) and paginated on the blog list.
- No manual index — dropping a valid Markdown file here is enough.

## Adding a New Remote Image Host (for hero images)

Edit `next.config.js` and add a `remotePatterns` entry:

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    { protocol: 'https', hostname: 'images.contentstack.io', pathname: '/**' },
    // Add your host here
  ],
}
```

## Local Testing

- Run `npm run dev` and open `http://localhost:3000/blog` to verify your article.

Happy writing!
