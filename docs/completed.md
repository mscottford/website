# Completed Work

This document archives completed tasks from the project TODO list.

## Site Launch (2026-01-20)

The site has been successfully launched at https://mscottford.com.

## Calendar Page (2026-01-20)

Added a `/calendar` page that embeds the Google Calendar booking page via iframe. The booking URL is stored in the `NEXT_PUBLIC_CALENDAR_BOOKING_URL` environment variable (see `.env` file).

The site contains no links to the calendar page (accessible only via direct URL).

- [x] Research embedding options for Google Calendar booking pages via web search
- [x] Utilize iframe embedding to render booking calendar within site design

## Launch Plan

- [x] Fix image loading on blog posts - the keyboard hacks post has broken images
- [x] Update all placeholder content that is not in a "hidden" state (see Placeholder Content section)
- [x] Add link on homepage below article list to view all articles
- [x] Test RSS feed migration to ensure existing subscribers are not disrupted (see RSS Feed Test Results below)
- [x] Test S3 redirects to ensure all old URLs redirect properly (23/23 passed on staging)
- [x] Remove newsletter signup functionality. We are not using this feature.
- [x] Remove duplicate titles from imported Tumblr posts - the title appears both in frontmatter and as the first H1 in the content
- [x] Make footer navigation links dynamic - currently hardcoded, should use nav items from content-collections and respect hidden flag
- [x] Complete all items from the Deployment sections (Terraform, GitHub Actions)

### Hidden Content

Implemented a feature flag to control the visibility of unfinished content. The content is visible when running a development server but hidden in production builds until ready.

- [x] Hide the nav links for the about, projects, speaking, and uses pages until content is added
- [x] Hide the resume section on the homepage until the about page is done
- [x] Hide the photo section on the homepage until real photos are added

### Visible Placeholder Content

These items were updated before launch:

- [x] `src/app/layout.tsx` - Site metadata
  - [x] Page title template (currently "Spencer Sharp")
  - [x] Meta description

- [x] `src/components/Footer.tsx`
  - [x] Copyright name (currently "Spencer Sharp")

## Old Content Import

### Import Script Requirements

Created `scripts/import-tumblr/index.ts` to automate the migration:

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

### RSS Feed Compatibility

**Mitigations implemented:**

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

### Metadata & SEO

**Improvements completed:**

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

**Directory structure:**
```
deploy/terraform/
├── bootstrap/           # Shared resources (tfstate bucket, budget alerts)
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── backend.tf
│   └── secrets.auto.tfvars (gitignored - contains alert_phone)
├── main.tf              # Per-environment resources (S3, CloudFront, DNS)
├── variables.tf
├── backend.tf
├── staging.tfvars
└── production.tfvars
```

**State files (in S3 `mscottford.com-tfstate`):**
- `bootstrap/terraform.tfstate` - Shared resources
- `staging/terraform.tfstate` - Staging environment
- `production/terraform.tfstate` - Production environment

**Deployment commands:**
- `pnpm deploy:staging` - Full staging deploy (runs bootstrap first)
- `pnpm deploy:production` - Full production deploy (runs bootstrap first)
- `pnpm deploy:plan:staging` - Preview staging changes
- `pnpm deploy:plan:production` - Preview production changes
- `pnpm deploy:bootstrap` - Apply shared infrastructure only

**Bootstrap resources (shared across environments):**
- [x] S3 bucket for Terraform state with versioning and encryption
- [x] S3 backend configuration for remote state
- [x] Cost budget and SNS alerts

**Per-environment resources:**
- [x] S3 bucket for static site
- [x] S3 bucket website configuration (index.html, 404.html)
- [x] CloudFront distribution with Origin Access Control (OAC)
- [x] Route 53 A records
- [x] Automatic content-type detection based on file extension

**Infrastructure improvements completed:**

- [x] **Production deployment support** - Deploy to either environment:
  - Staging: `staging.mscottford.com` via `pnpm deploy:staging`
  - Production: `mscottford.com` via `pnpm deploy:production`
  - Separate state files per environment prevent cross-environment conflicts
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
  - Managed in `bootstrap/` (shared across environments)
  - AWS Budget tracking only resources tagged with `Project=mscottford-website`
  - SMS notifications via SNS (set `alert_phone` in `bootstrap/secrets.auto.tfvars`)
  - Alerts at 80% of budget, 100% forecasted, and 100% actual
  - Configure `monthly_budget` in `bootstrap/variables.tf` (default $10)
  - All project resources tagged with `Project` and `Environment` for cost tracking

- [x] **SSL/TLS certificate** - ACM certificates for custom domain HTTPS
  - Separate certificates per environment (site + www)
  - DNS validation via Route 53
  - CloudFront configured with TLS 1.2 minimum, SNI-only

- [x] **CloudFront cache behaviors** - Optimize caching per content type
  - `_next/static/*`: 1 year cache (hashed filenames = immutable)
  - `images/*`: 30 days cache
  - `feed.xml`: No cache (always fresh for subscribers)
  - Default (HTML): 1 day cache, max 7 days

### Additional Deployment Considerations

- [x] **CloudFront error pages** - Custom error responses configured:
  - 404 → `/404.html` with 404 status
  - 403 → `/404.html` with 404 status (S3 returns 403 for missing files with OAC)

### Other Considerations

- [x] **Slug generation**: Uses filename as slug; import script uses Tumblr's slug
- [x] **Image hosting**: Images downloaded and stored locally alongside MDX files

## Placeholder Content

### Pages

- [x] `src/app/layout.tsx` - Site metadata
  - [x] Page title template ("Spencer Sharp")
  - [x] Meta description

- [x] `src/app/page.tsx` - Homepage (partial)
  - [x] Tagline ("Software designer, founder, and amateur astronaut")
  - [x] Bio paragraph mentioning "Spencer" and "Planetaria"
  - [x] Social media links (all `href="#"`)

### Components

- [x] `src/components/Footer.tsx`
  - [x] Copyright name ("Spencer Sharp")

### Images

- [x] `src/images/avatar.jpg` - Profile avatar
- [x] `src/images/photos/image-1.jpg` - Homepage carousel
- [x] `src/images/photos/image-2.jpg` - Homepage carousel
- [x] `src/images/photos/image-3.jpg` - Homepage carousel
- [x] `src/images/photos/image-4.jpg` - Homepage carousel
- [x] `src/images/photos/image-5.jpg` - Homepage carousel
