# Blog Content Management

This directory contains all blog post content as individual Markdown files. Each file represents a single blog post with frontmatter metadata.

## File Structure

Each blog post is stored as a `.md` file with the following format:

```markdown
---
slug: "post-slug"
title: "Post Title"
excerpt: "Brief description of the post"
date: "YYYY-MM-DD"
readTime: "X min read"
tags: ["Tag1", "Tag2", "Tag3"]
author: "Author Name"
imageUrl: "https://..."
imageAlt: "Image description"
---

# Post Title

Your markdown content here...
```

## How to Update Blog Content

### Option 1: Edit Markdown Files (Recommended for Content Only)

1. Edit the `.md` file in this directory
2. Update the content below the frontmatter
3. Copy the updated content (excluding the frontmatter section)
4. Open `/lib/blog-data.ts`
5. Find the corresponding blog post object
6. Replace the `content` field with your updated markdown

### Option 2: Edit blog-data.ts Directly

1. Open `/lib/blog-data.ts`
2. Find the blog post you want to update
3. Edit the `content` field directly
4. Optionally sync changes back to the markdown file

## Why Two Locations?

The markdown files in this directory serve as the **source of truth** for content, making it easy to:
- Edit blog posts in a clean, readable format
- Version control content changes
- Use markdown editors with preview
- Keep content separate from code

However, because the Next.js app uses client components for interactivity (search, filters), we can't dynamically read files at runtime. The content must be included in `/lib/blog-data.ts` for the build process.

## Adding a New Blog Post

1. **Create Markdown File**: Create a new `.md` file in this directory with frontmatter
2. **Update blog-data.ts**: Add a new object to the `blogPosts` array in `/lib/blog-data.ts` with all metadata and content
3. **Update Tags** (if needed): Add any new tags to the `blogTags` array in `/lib/blog-data.ts`

## Content Guidelines

- **Headings**: Use `#` for H1 (title), `##` for H2 (sections), `###` for H3 (subsections)
- **Bold**: Use `**text**` for bold
- **Italic**: Use `*text*` for italic
- **Code blocks**: Use triple backticks with language identifier:
  ````markdown
  ```bash
  command here
  ```
  ````
- **Inline code**: Use single backticks: \`code\`
- **Lists**: Use `-` or `*` for bullets, `1.` for numbered lists
- **Links**: Use `[text](url)` format
- **Images**: Hosted externally (Unsplash recommended)

## Formatting Features

The blog uses `react-markdown` with GitHub Flavored Markdown (GFM) support, providing:
- Proper heading hierarchy and spacing
- Syntax-highlighted code blocks
- Styled lists and blockquotes
- Responsive typography
- Dark mode support
- Clean, readable layout

## Image Guidelines

- Use high-quality images from Unsplash or similar sources
- Image URLs should be in format: `https://images.unsplash.com/photo-{id}?w=1200&h=600&fit=crop`
- Provide descriptive alt text for accessibility
- Images appear as hero images at the top of each post

## Tags

Current available tags (can be extended):
- Cloud, AWS, Azure, GCP, Architecture
- AI, RAG, Vector Databases
- Distributed Systems, Microservices
- Elasticsearch, Search, Database
- Observability, MLOps, LLMOps
- Agentic AI, Automation, Workflows
- History, Trends
