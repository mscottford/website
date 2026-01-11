# Project TODOs

This document outlines various tasks and improvements.

## Launch Plan

This section documents the work that needs to be completed before launching the new site.

- [x] Fix image loading on blog posts - the keyboard hacks post has broken images
- [x] Update all placeholder content that is not in a "hidden" state (see Placeholder Content section)
- [ ] Complete all items from the Deployment sections (Terraform, GitHub Actions)
- [x] Add link on homepage below article list to view all articles
- [x] Test RSS feed migration to ensure existing subscribers are not disrupted (see RSS Feed Test Results below)
- [x] Test S3 redirects to ensure all old URLs redirect properly (23/23 passed on staging)
- [x] Remove newsletter signup functionality. We are not using this feature.
- [x] Remove duplicate titles from imported Tumblr posts - the title appears both in frontmatter and as the first H1 in the content
- [x] Make footer navigation links dynamic - currently hardcoded, should use nav items from content-collections and respect hidden flag

### Hidden Content

Implement a feature flag or similar capability to control the visibility of unfinished content. The content should be visible when running a development server but hidden in production builds until ready.

- [x] Hide the nav links for the about, projects, speaking, and uses pages until content is added
- [x] Hide the resume section on the homepage until the about page is done
- [x] Hide the photo section on the homepage until real photos are added

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

### Visible Placeholder Content

These items are currently visible on the site and need to be updated before launch:

- [x] `src/app/layout.tsx` - Site metadata
  - [x] Page title template (currently "Spencer Sharp")
  - [x] Meta description

- [x] `src/components/Footer.tsx`
  - [x] Copyright name (currently "Spencer Sharp")

## Old Content Import

This section tracks the work that needs to be done to import old content from https://mscottford.com.

### Source Analysis

The existing blog is hosted on Tumblr with a custom domain. Key findings:

- **Post count**: ~20 posts (2011-2024)
- **API access**: `https://mscottford.com/api/read/json` provides full post data
- **Content types**: Text posts, quotes, images, conversation posts
- **Available fields**: `regular-title`, `regular-body`, `date-gmt`, `unix-timestamp`, `slug`, embedded images with srcsets

### Import Script Requirements

Create `scripts/import-tumblr/index.ts` to automate the migration:

- [x] **Fetch posts from Tumblr API**
  - Use `https://mscottford.com/api/read/json?num=50` to get all posts
  - Parse JSONP response (wrapped in `var tumblr_api_read = {...}`)

- [x] **Convert HTML to MDX**
  - Use a library like `turndown` to convert HTML to Markdown
  - Handle code blocks (detect `<pre>` and `<code>` tags)
  - Extract and preserve image URLs
  - Generate appropriate frontmatter (`title`, `description`)

- [x] **Download and store images**
  - Download images referenced in posts to `content/posts/[date]/` alongside the MDX file
  - Update image references to use relative paths

- [x] **Create MDX files**
  - Output to `content/posts/[YYYY-MM-DD]/[slug].mdx`
  - Generate description from first paragraph if not available

- [x] **Date handling via `dateTime` frontmatter**
  - All posts use a required `dateTime` field in frontmatter for `createdAt`
  - Import script sets `dateTime` from Tumblr's `unix-timestamp`

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

**Recommended mitigations:**

- [x] **Add `/rss` redirect** - Handled via S3 routing rules (see URL Redirects section)
- [x] **Preserve Tumblr GUIDs for imports** - Store original Tumblr post ID in frontmatter and use it as GUID for imported posts:
  ```yaml
  ---
  title: "Post Title"
  description: "..."
  tumblrId: "757620834301083648"  # Original Tumblr post ID
  ---
  ```
- [x] **Update feed route** - Modify `feed.xml/route.ts` to use `tumblrId` as GUID when present:
  ```typescript
  feed.addItem({
    id: post.tumblrId
      ? `https://mscottford.com/post/${post.tumblrId}`
      : publicUrl,
    // ...
  });
  ```
- [x] **Exclude old imports from feed** - Only includes posts from 2024 onwards to avoid flooding subscribers
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

**Recommended improvements:**

- [x] **Update root layout metadata** - Add Open Graph and Twitter Card defaults:
  ```typescript
  export const metadata: Metadata = {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
    title: { template: '%s - M. Scott Ford', default: '...' },
    description: '...',
    openGraph: {
      type: 'website',
      locale: 'en_US',
      siteName: 'M. Scott Ford',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@mscottford',
    },
  }
  ```

- [x] **Add per-article metadata** - Export `generateMetadata` in `src/app/articles/[slug]/page.tsx`:
  ```typescript
  export async function generateMetadata({ params }): Promise<Metadata> {
    const article = allPosts.find((post) => post.slug === params.slug);
    return {
      title: article.title,
      description: article.description,
      openGraph: {
        type: 'article',
        publishedTime: article.createdAt,
        modifiedTime: article.lastModifiedAt,
        authors: ['M. Scott Ford'],
      },
    };
  }
  ```

- [x] **Add JSON-LD structured data** - Create component for article pages:
  ```typescript
  // src/components/ArticleJsonLd.tsx
  export function ArticleJsonLd({ article }) {
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: article.title,
      description: article.description,
      datePublished: article.createdAt,
      dateModified: article.lastModifiedAt,
      author: {
        '@type': 'Person',
        name: 'M. Scott Ford',
        url: 'https://mscottford.com/about',
      },
    };
    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
    );
  }
  ```

- [ ] **Add homepage JSON-LD ItemList** - List recent articles for search engines

- [ ] **Create default OG image** - Design `public/og-image.png` (1200x630px) for social sharing

- [ ] **Support per-article OG images** - Optional `ogImage` field in frontmatter for custom social images

### URL Redirects (S3 + CloudFront)

S3 supports native HTTP 301 redirects via routing rules - proper SEO-friendly redirects.

**Old Tumblr URL patterns to redirect:**

| Pattern | Example | New Location |
|---------|---------|--------------|
| `/post/{id}` | `/post/757620834301083648` | `/articles/{slug}` |
| `/post/{id}/{slug}` | `/post/757620834301083648/macbook-pro-keyboard-hacks-inspired-by` | `/articles/{slug}` |
| `/rss` | `/rss` | `/feed.xml` |
| `/archive` | `/archive` | `/articles` |

**Implementation:**

- [x] **Store Tumblr metadata in frontmatter** for imported posts:
  ```yaml
  ---
  title: "MacBook Pro Keyboard Hacks"
  tumblrId: "757620834301083648"
  tumblrSlug: "macbook-pro-keyboard-hacks-inspired-by"
  ---
  ```

- [x] **Generate S3 routing rules** - Create build script `scripts/generate-s3-redirects.ts`:
  ```typescript
  import { allPosts } from 'content-collections';

  const rules = allPosts
    .filter((post) => post.tumblrId)
    .map((post) => ({
      Condition: { KeyPrefixEquals: `post/${post.tumblrId}` },
      Redirect: {
        HttpRedirectCode: '301',
        ReplaceKeyWith: `articles/${post.slug}/`,
      },
    }));

  // Add static redirects
  rules.push(
    { Condition: { KeyPrefixEquals: 'rss' }, Redirect: { HttpRedirectCode: '301', ReplaceKeyWith: 'feed.xml' } },
    { Condition: { KeyPrefixEquals: 'archive' }, Redirect: { HttpRedirectCode: '301', ReplaceKeyWith: 'articles/' } },
  );

  console.log(JSON.stringify({ RoutingRules: rules }, null, 2));
  ```

- [x] **Apply S3 routing rules via Terraform** - Integrate generated routing rules into Terraform configuration

**Note:** S3 routing rules are processed sequentially. More specific rules should come before general rules.

### Deployment Infrastructure (Terraform)

Infrastructure is managed via Terraform in `deploy/terraform/`. The setup uses S3 for static hosting and CloudFront for CDN/HTTPS.

**Current infrastructure (`deploy/terraform/`):**
- [x] S3 bucket for Terraform state with versioning and encryption
- [x] S3 backend configuration for remote state
- [x] S3 bucket for static site (staging environment)
- [x] S3 bucket website configuration (index.html, 404.html)
- [x] CloudFront distribution with Origin Access Control (OAC)
- [x] Route 53 A record for `staging.mscottford.com`
- [x] Automatic content-type detection based on file extension

**Infrastructure improvements needed:**

- [x] **Production deployment support** - Add ability to deploy to either:
  - Staging: `staging.mscottford.com` via `pnpm deploy:staging`
  - Production: `mscottford.com` via `pnpm deploy:production`
  - Uses separate tfvars files and S3 state keys for isolation
  - Preview changes with `pnpm deploy:plan:staging` or `pnpm deploy:plan:production`

- [x] **www redirect** - Add redirect from `www.mscottford.com` to `mscottford.com`
  - S3 buckets configured for redirect (staging and production)
  - CloudFront distributions for HTTPS support
  - ACM certificates with DNS validation
  - Route 53 A records for www subdomains
  - Redirects: `www.staging.mscottford.com` → `staging.mscottford.com`, `www.mscottford.com` → `mscottford.com`

- [x] **Make S3 buckets private** - Uses CloudFront OAC exclusively
  - S3 bucket blocks all public access
  - Bucket policy allows only CloudFront service principal with SourceArn condition
  - CloudFront Function handles redirects and adds /index.html for directory requests
  - Direct S3 access returns 403 Forbidden

- [x] **Enable S3 versioning for static site buckets** - For rollback capability
  - Versioning enabled on static site bucket
  - Lifecycle rule expires old versions after 30 days, but always keeps at least 2 previous versions

- [x] **Enable access logging** - For traffic analysis and debugging
  - Dedicated logging S3 bucket per environment
  - CloudFront access logs enabled (S3 logs skipped - redundant with OAC)
  - Cost controls: logs expire after 14 days (staging) or 30 days (production)
  - Public access blocked on logging bucket

- [x] **Cost budget alarm** - Alert if project costs exceed monthly budget
  - AWS Budget tracking only resources tagged with `Project=mscottford-website`
  - SMS notifications via SNS (set `TF_VAR_alert_phone` env var in E.164 format)
  - Alerts at 80% of budget, 100% forecasted, and 100% actual
  - Configure `monthly_budget` in tfvars (default $10)
  - All project resources tagged with `Project` and `Environment` for cost tracking

- [ ] **SSL/TLS certificate** - Use ACM for custom domain HTTPS
  - Request ACM certificate for `mscottford.com` and `*.mscottford.com`
  - Update CloudFront to use custom certificate instead of default

- [ ] **CloudFront cache behaviors** - Optimize caching per content type
  - Long cache for static assets (images, fonts)
  - Short/no cache for HTML/JS/CSS and feed.xml

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

- [x] **CloudFront error pages** - Custom error responses configured:
  - 404 → `/404.html` with 404 status
  - 403 → `/404.html` with 404 status (S3 returns 403 for missing files with OAC)

- [ ] **Terraform state locking** - Add DynamoDB table for state locking
  - Prevents concurrent modifications
  - Recommended for team environments or CI/CD

- [ ] **Cache invalidation strategy** - More granular than `/*`:
  - Invalidate only changed paths on deploy
  - Reduces invalidation costs at scale

### Other Considerations

- [ ] **Filter content**: Decide which posts to import (skip image-only posts? link-only posts?)
- [x] **Slug generation**: Uses filename as slug; import script uses Tumblr's slug
- [x] **Image hosting**: Images downloaded and stored locally alongside MDX files
- [ ] **Code syntax highlighting**: Ensure imported code blocks use proper language hints

## Placeholder Content

This section tracks placeholder content from the Tailwind UI Spotlight template that needs to be replaced with real content.

### Pages

- [ ] `src/app/page.tsx` - Homepage
  - [x] Tagline ("Software designer, founder, and amateur astronaut")
  - [x] Bio paragraph mentioning "Spencer" and "Planetaria"
  - [ ] Resume section (Planetaria, Airbnb, Facebook, Starbucks positions)
  - [x] Social media links (all `href="#"`)
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

- [x] `src/app/layout.tsx` - Site metadata
  - [x] Page title template ("Spencer Sharp")
  - [x] Meta description

### Components

- [x] `src/components/Footer.tsx`
  - [x] Copyright name ("Spencer Sharp")

### Images

- [x] `src/images/avatar.jpg` - Profile avatar
- [ ] `src/images/portrait.jpg` - About page portrait
- [ ] `src/images/photos/image-1.jpg` - Homepage carousel
- [ ] `src/images/photos/image-2.jpg` - Homepage carousel
- [ ] `src/images/photos/image-3.jpg` - Homepage carousel
- [ ] `src/images/photos/image-4.jpg` - Homepage carousel
- [ ] `src/images/photos/image-5.jpg` - Homepage carousel
- [ ] `src/images/logos/airbnb.svg` - Resume logo
- [ ] `src/images/logos/facebook.svg` - Resume logo
- [ ] `src/images/logos/starbucks.svg` - Resume logo
- [ ] `src/images/logos/planetaria.svg` - Resume/project logo
- [ ] `src/images/logos/animaginary.svg` - Project logo
- [ ] `src/images/logos/cosmos.svg` - Project logo
- [ ] `src/images/logos/helio-stream.svg` - Project logo
- [ ] `src/images/logos/open-shuttle.svg` - Project logo
