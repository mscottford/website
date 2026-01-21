# Project TODOs

This document outlines various tasks and improvements.

## Calendar Page

This section documents the work needed to add a `/calendar` page that embeds my Google Calendar [booking page](CALENDAR_BOOKING_URL_REDACTED). If Google provides an API for embedding it into a page, then I want to utilize that. Otherwise, I want to simply redirect to the booking url provided above.

The site should contain no links to the calendar page.

- [ ] Research embedding options for Google Calendar booking pages via web search
- [ ] Option 1: Utilize embedding API to render booking details within site design and branding
- [ ] Option 2: HTTP redirect to CALENDAR_BOOKING_URL_REDACTED
- [ ] Option 3: Meta tag refresh redirect to CALENDAR_BOOKING_URL_REDACTED

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

## Image Optimization

This section documents the work needed to implement on-demand image optimization using CloudFront, Lambda, and S3, integrated with Next.js via a custom image loader.

### Overview

Since this site uses Next.js static export (`output: 'export'`), the default Next.js Image Optimization API is not available. Instead, we'll deploy a serverless image optimization service on AWS that transforms images on-demand and serves them from `assets.mscottford.com`.

**Reference architecture:** [AWS Blog: Image Optimization using Amazon CloudFront and AWS Lambda](https://aws.amazon.com/blogs/networking-and-content-delivery/image-optimization-using-amazon-cloudfront-and-aws-lambda/)

### Architecture

```
User Request
     ↓
CloudFront (assets.mscottford.com)
     ↓
CloudFront Function (normalize request, select format from Accept header)
     ↓
Origin Shield (regional cache layer)
     ↓
S3 (transformed images bucket)
     ↓ (on 403/miss)
Origin Failover → Lambda Function URL
                       ↓
                  Download original from S3
                       ↓
                  Transform with Sharp (resize, format conversion)
                       ↓
                  Store transformed image in S3
                       ↓
                  Return image (cached by CloudFront)
```

### Request URL Format

```
https://assets.mscottford.com/images/example.jpg?format=auto&width=300&quality=80
```

**Supported parameters:**
- `width` - Target width in pixels
- `quality` - Image quality (1-100, optional)
- `format` - Output format: `jpeg`, `webp`, `avif`, or `auto` (auto selects best format based on browser Accept header)

### Next.js Integration

With static export, Next.js requires a [custom image loader](https://nextjs.org/docs/app/guides/static-exports#image-optimization). The loader function receives `src`, `width`, and `quality` parameters and returns the optimized image URL.

**Configuration in `next.config.mjs`:**
```js
const nextConfig = {
  output: 'export',
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
}
```

**Custom loader (`src/lib/image-loader.ts`):**
```ts
export default function imageLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}) {
  const params = new URLSearchParams({
    width: width.toString(),
    format: 'auto',
  })
  if (quality) {
    params.set('quality', quality.toString())
  }
  return `https://assets.mscottford.com${src}?${params.toString()}`
}
```

### Infrastructure (Terraform)

All infrastructure will be managed via Terraform in `deploy/terraform/`. Based on the [AWS image-optimization sample](https://github.com/aws-samples/image-optimization), the following resources are needed:

**S3 Buckets:**
- Original images bucket (source)
- Transformed images bucket (cache) with lifecycle policy (90-day expiration)

**Lambda Function:**
- Runtime: Node.js with Sharp library (ARM64 for cost efficiency)
- Function URL enabled for CloudFront Origin Failover
- Memory: 1024MB minimum (Sharp requires significant memory)
- Timeout: 15-30 seconds
- IAM role with S3 read/write permissions

**CloudFront Distribution:**
- Custom domain: `assets.mscottford.com`
- ACM certificate (in us-east-1)
- Origin 1: S3 transformed images bucket
- Origin 2 (failover): Lambda Function URL
- Origin Group: Failover from S3 to Lambda on 403
- Origin Shield: Enabled (reduces Lambda invocations)
- CloudFront Function: Viewer request handler for URL normalization and format selection
- Cache policy: Long TTL (1 year) with query string forwarding
- Origin Access Control (OAC) for secure S3 access

**Route 53:**
- A record alias for `assets.mscottford.com` → CloudFront distribution

### Implementation Tasks

#### Terraform Infrastructure

- [ ] **Create S3 buckets** - Original images and transformed images buckets with appropriate policies
- [ ] **Create Lambda function** - Image transformation function using Sharp
  - [ ] Bundle Sharp library for ARM64 Lambda
  - [ ] Implement transformation logic (resize, format conversion)
  - [ ] Configure Function URL
  - [ ] Set up IAM role with S3 permissions
- [ ] **Create CloudFront Function** - URL normalization and format selection based on Accept header
- [ ] **Create CloudFront distribution** - With origin group failover configuration
  - [ ] Configure `assets.mscottford.com` custom domain
  - [ ] Request/import ACM certificate in us-east-1
  - [ ] Set up Origin Access Control for S3
  - [ ] Configure Origin Shield
  - [ ] Set up origin group with failover behavior
- [ ] **Create Route 53 record** - A record alias for `assets.mscottford.com`
- [ ] **Add S3 lifecycle policy** - Auto-delete transformed images after 90 days

#### Next.js Integration

- [ ] **Create custom image loader** - `src/lib/image-loader.ts` pointing to `assets.mscottford.com`
- [ ] **Update next.config.mjs** - Configure custom loader for static export
- [ ] **Update existing `<img>` tags** - Replace with Next.js `<Image>` component where appropriate

#### Image Migration

- [ ] **Upload original images to S3** - Sync images from `public/` and post content directories
- [ ] **Update image paths** - Ensure paths work with the new loader
- [ ] **GitHub Actions integration** - Sync images to S3 during deployment

### Caching Strategy

- **CloudFront edge cache:** 1 year TTL for transformed images
- **Origin Shield:** Regional cache layer to reduce Lambda invocations
- **S3 storage:** Transformed images stored with 90-day lifecycle policy
- **Browser cache:** `Cache-Control: max-age=31536000, immutable` for optimized images

### Cost Considerations

- Lambda invocations only occur on cache miss (first request for each size/format combination)
- Origin Shield reduces duplicate Lambda invocations from different edge locations
- S3 lifecycle policy prevents unbounded storage growth
- CloudFront caching minimizes origin requests
