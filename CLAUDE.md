# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal website and blog for M. Scott Ford (mscottford.com) built with Next.js 15 App Router, React 19, and TypeScript. The site is statically exported and deployed to S3 + CloudFront.

## Commands

```bash
pnpm dev          # Start development server (includes favicon pre-build)
pnpm build        # Production build with static export to /out
pnpm lint         # Run Next.js ESLint
pnpm build:favicons  # Generate favicons from source image
```

## Architecture

### Content System

Content is managed via Content Collections (`content-collections.ts`):
- **Posts**: MDX files in `/content/posts/YYYY-MM-DD/[slug].mdx` with YAML frontmatter (title, description, dateTime required)
- **Social Links**: YAML files in `/content/social-links/`
- **Nav Items**: YAML files in `/content/nav-items/`

Posts are imported as `allPosts` from `content-collections` and rendered via dynamic route `/articles/[slug]`. Slugs derive from filename, not title. Images for posts are stored alongside their MDX files.

### Key Directories

- `src/app/` - Next.js App Router pages and layouts
- `src/components/` - React components (compound pattern used, e.g., `Card.Title`)
- `src/lib/` - Utilities (article sorting, date formatting)
- `deploy/terraform/` - Infrastructure as Code for S3/CloudFront deployment

### Rendering Model

- Server components by default; client components marked with `'use client'`
- Static export enabled via `STATIC_EXPORT` env var in next.config.mjs
- RSS feed generated at `/feed.xml` route

## Configuration

- **TypeScript paths**: `@/*` → `./src/*`, `content-collections` → `./.content-collections/generated`
- **Styling**: Tailwind CSS v4 with PostCSS API; dark mode via next-themes
- **Code style**: Single quotes, no semicolons (Prettier with Tailwind plugin)

## Environment Variables

- `NEXT_PUBLIC_SITE_URL` - Required for feed/metadata generation (e.g., `https://mscottford.com`)

## Development Notes

- TODO.md contains detailed project roadmap and remaining work items
- Favicon generation runs automatically before dev/build/start
- Static export builds to `/out` directory - understand Next.js static export limitations
