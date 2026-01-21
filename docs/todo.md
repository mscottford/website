# Project TODOs

This document outlines various tasks and improvements.

## Calendar Page

This section documents the work needed to add a `/calendar` page that embeds my Google Calendar [booking page](CALENDAR_BOOKING_URL_REDACTED). If Google provides an API for embedding it into a page, then I want to utilize that. Otherwise, I want to simply redirect to the booking url provided above.

The site should contain no links to the calendar page.

- [ ] Research embedding options for Google Calendar booking pages via web search
- [ ] Option 1: Utilize embedding API to render booking details within site design and branding
- [ ] Option 2: HTTP redirect to CALENDAR_BOOKING_URL_REDACTED
- [ ] Option 3: Meta tag refresh redirect to CALENDAR_BOOKING_URL_REDACTED

## Launch Plan

This section documents the work that needs to be completed before launching the new site.

- [ ] Complete all items from the Deployment sections (Terraform, GitHub Actions)

### RSS Feed Test Results

**How to run the test:**

```bash
pnpm test:rss https://mscottford.com/rss https://staging.mscottford.com/feed.xml
```

The script compares the production RSS feed (baseline) with the staging feed (new) and detects changes that would impact existing subscribers. Posts older than 7 days that appear as "new" will cause the test to fail.

**Test Results (2026-01-09):**

| Category | Count | Status |
|----------|-------|--------|
| Old posts appearing as NEW | 1 | FAILURE |
| Genuinely new items | 0 | - |
| Posts removed from feed | 19 | Info |
| Posts modified | 1 | Warning |

**Issues to address:**

1. **"First Post" would appear as NEW** - This test post (dated 2025-12-24) exists in staging but not in production. It would show up as a new item to existing subscribers. Either remove this post before launch or accept that it will appear as new.

2. **19 posts removed from feed** - The old Tumblr feed has 20 items, but the staging feed only has 2. Many posts haven't been migrated yet, or the feed is intentionally limited.

3. **"MacBook Pro Keyboard Hacks" link changed** - The link format changed from Tumblr URL (`/post/757620834301083648`) to the new format (`/articles/macbook-pro-keyboard-hacks-inspired-by`). The GUID matches so it won't appear as a new item, but the link change is noted.

**To pass the test before launch:**

- Remove or update the "First Post" test content
- Ensure all migrated posts preserve their original Tumblr GUIDs in the feed
- Re-run the test: `pnpm test:rss https://mscottford.com/rss https://staging.mscottford.com/feed.xml`

## Old Content Import

This section tracks the work that needs to be done to import old content from https://mscottford.com.

### Source Analysis

The existing blog is hosted on Tumblr with a custom domain. Key findings:

- **Post count**: ~20 posts (2011-2024)
- **API access**: `https://mscottford.com/api/read/json` provides full post data
- **Content types**: Text posts, quotes, images, conversation posts
- **Available fields**: `regular-title`, `regular-body`, `date-gmt`, `unix-timestamp`, `slug`, embedded images with srcsets

### Posts to Import

| Date | Title | Type |
|------|-------|------|
| Nov 11, 2011 | VCU Brand Center restroom | Image |
| Nov 12, 2011 | Overheard: Party conversation | Quote |
| Nov 15, 2011 | Taps rubygem | Tutorial |
| Nov 16, 2011 | Protect The Internet | Link |
| Jun 7, 2012 | IRB readline support | Tutorial |
| Jun 13, 2012 | DatabaseCleaner performance tip | Tutorial |
| Jun 13, 2012 | iFixit downtime page | Quote |
| Jun 14, 2012 | Verizon router hostname fix | Tutorial |
| Jul 20, 2012 | 50 Shades of Analytics | Quote |
| Aug 8, 2012 | Reaction to 140stitches | Text |
| Aug 28, 2012 | Overheard: Weight loss strategy | Quote |
| Sep 4, 2012 | Remote debugging with poltergeist | Tutorial |
| Sep 24, 2012 | Dvorak Japanese Keyboard Layouts | Tutorial |
| Dec 11, 2012 | Monkey patching away default_scope | Tutorial |
| Mar 7, 2013 | Hooked on Testing | Text |
| Mar 27, 2013 | Hooked on Testing (announcement) | Text |
| Aug 27, 2013 | Epifywhat? | Text |
| Dec 3, 2013 | Relics from Languages Past | Text |
| Oct 3, 2019 | Does Your Team Prevent You From Refactoring? | Text |
| Aug 1, 2024 | MacBook Pro Keyboard Hacks | Tutorial |

### RSS Feed Compatibility

Existing RSS subscribers at `https://mscottford.com/rss` need to be considered during migration.

**Current Tumblr RSS feed:**
- URL: `https://mscottford.com/rss`
- Format: RSS 2.0
- GUID pattern: `https://mscottford.com/post/[numeric-id]` (e.g., `post/757620834301083648`)

**New site feed (`src/app/feed.xml/route.ts`):**
- URL: `/feed.xml`
- Format: Atom 1.0
- GUID pattern: `${siteUrl}/articles/${post.slug}`

**Problems for existing subscribers:**
1. **Different GUIDs** - All imported posts will appear as "new" items since GUIDs won't match
2. **Different feed URL** - Subscribers using `/rss` will get 404 after domain switch
3. **Different format** - RSS 2.0 vs Atom (most readers handle both, but not ideal)
4. **Historical dates** - 20 "new" posts with dates from 2011-2024 may confuse readers

**Remaining work:**

- [ ] **Offer both RSS and Atom** - Add `/feed.rss` endpoint for RSS 2.0 format compatibility

### Metadata & SEO

The Tumblr site generates JSON-LD structured data for posts. The new site should implement comprehensive metadata for SEO and social sharing.

**Tumblr's current metadata (per article):**
- JSON-LD `SocialMediaPosting` schema with:
  - `url`, `datePublished`, `articleBody` (summary)
  - `author` (Person with name, URL, avatar image)
  - `image` array (associated images with dimensions)
- JSON-LD `ItemList` on homepage listing all posts

**Current site metadata (`src/app/layout.tsx`):**
- Basic Next.js `Metadata` with title template and description
- RSS feed link in alternates
- Missing: Open Graph, Twitter Cards, JSON-LD, per-article metadata

**Remaining work:**

- [ ] **Add homepage JSON-LD ItemList** - List recent articles for search engines

- [ ] **Create default OG image** - Design `public/og-image.png` (1200x630px) for social sharing

- [ ] **Support per-article OG images** - Optional `ogImage` field in frontmatter for custom social images

### Deployment Automation (GitHub Actions)

Automate the build and deploy process via GitHub Actions and Terraform.

**GitHub Actions workflows needed:**

- [ ] **Staging deployment on PR** - Deploy preview to staging for pull requests
  - Trigger on `pull_request` events
  - Build the site with staging URL
  - Run `terraform apply` for staging environment
  - Comment on PR with staging URL

- [ ] **Production deployment on merge** - Deploy to production when merging to `main`
  - Trigger on `push` to `main` branch
  - Build the site with production URL
  - Run `terraform apply` for production environment
  - Invalidate CloudFront cache

- [ ] **Configure GitHub secrets/variables** - Add to repository settings:
  - `AWS_ACCESS_KEY_ID` - IAM user/role access key
  - `AWS_SECRET_ACCESS_KEY` - IAM user/role secret key
  - Or use OIDC: `AWS_ROLE_ARN` for keyless authentication (recommended)

- [ ] **Create IAM role for GitHub Actions** - With minimal permissions:
  - S3: PutObject, GetObject, DeleteObject, ListBucket for site buckets
  - CloudFront: CreateInvalidation, GetDistribution
  - Route 53: ChangeResourceRecordSets (if DNS changes needed)
  - Consider using OIDC provider for keyless auth (more secure)

**Cache strategy:**
- Static assets (JS, CSS, images): Long cache (`max-age=31536000, immutable`)
- HTML files: Short cache with revalidation - CloudFront serves fresh content
- RSS feed: No cache - Always fresh for feed readers

**CloudFront invalidation notes:**
- First 1,000 invalidation paths per month are free
- Wildcard `/*` counts as one path
- Invalidations typically complete in 1-2 minutes

### Additional Deployment Considerations

Items to consider for a production-ready deployment:

- [ ] **Terraform state locking** - Add DynamoDB table for state locking
  - Prevents concurrent modifications
  - Recommended for team environments or CI/CD

- [ ] **Cache invalidation strategy** - More granular than `/*`:
  - Invalidate only changed paths on deploy
  - Reduces invalidation costs at scale

### Other Considerations

- [ ] **Filter content**: Decide which posts to import (skip image-only posts? link-only posts?)
- [ ] **Code syntax highlighting**: Ensure imported code blocks use proper language hints

## Placeholder Content

This section tracks placeholder content from the Tailwind UI Spotlight template that needs to be replaced with real content.

### Pages

- [ ] `src/app/page.tsx` - Homepage
  - [ ] Resume section (Planetaria, Airbnb, Facebook, Starbucks positions)
  - [ ] "Download CV" button link

- [ ] `src/app/about/page.tsx` - About page
  - [ ] Entire biography (fictional story about Spencer Sharp)
  - [ ] Email address (`spencer@planetaria.tech`)
  - [ ] Social media links (all `href="#"`)

- [ ] `src/app/projects/page.tsx` - Projects page
  - [ ] Page intro text
  - [ ] All 5 project entries (Planetaria, Animaginary, HelioStream, cosmOS, OpenShuttle)
  - [ ] Project links (most are `href="#"`)

- [ ] `src/app/speaking/page.tsx` - Speaking page
  - [ ] Page intro text
  - [ ] All conference entries (fictional talks)
  - [ ] All podcast entries (fictional appearances)
  - [ ] All event links (`href="#"`)

- [ ] `src/app/uses/page.tsx` - Uses page
  - [ ] Page intro text
  - [ ] All tool/software recommendations

### Images

- [ ] `src/images/portrait.jpg` - About page portrait
- [ ] `src/images/logos/airbnb.svg` - Resume logo
- [ ] `src/images/logos/facebook.svg` - Resume logo
- [ ] `src/images/logos/starbucks.svg` - Resume logo
- [ ] `src/images/logos/planetaria.svg` - Resume/project logo
- [ ] `src/images/logos/animaginary.svg` - Project logo
- [ ] `src/images/logos/cosmos.svg` - Project logo
- [ ] `src/images/logos/helio-stream.svg` - Project logo
- [ ] `src/images/logos/open-shuttle.svg` - Project logo
