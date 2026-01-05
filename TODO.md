# Template Filler Content to Replace

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

- [ ] **Configure S3 bucket website** - Apply routing rules via AWS CLI or Terraform:
  ```bash
  aws s3api put-bucket-website --bucket mscottford.com --website-configuration file://s3-website-config.json
  ```

- [ ] **Set up CloudFront distribution** - Required for HTTPS with custom domain

- [ ] **Configure Route 53 or DNS** - Point domain to CloudFront distribution

**S3 routing rules example:**
```xml
<RoutingRules>
  <RoutingRule>
    <Condition>
      <KeyPrefixEquals>post/757620834301083648</KeyPrefixEquals>
    </Condition>
    <Redirect>
      <HttpRedirectCode>301</HttpRedirectCode>
      <ReplaceKeyWith>articles/macbook-pro-keyboard-hacks/</ReplaceKeyWith>
    </Redirect>
  </RoutingRule>
  <RoutingRule>
    <Condition>
      <KeyPrefixEquals>rss</KeyPrefixEquals>
    </Condition>
    <Redirect>
      <HttpRedirectCode>301</HttpRedirectCode>
      <ReplaceKeyWith>feed.xml</ReplaceKeyWith>
    </Redirect>
  </RoutingRule>
</RoutingRules>
```

**Note:** S3 routing rules are processed sequentially. More specific rules should come before general rules.

### Deployment Automation (S3 + CloudFront)

Automate the build, deploy, and cache invalidation process.

**Deployment pipeline steps:**
1. Build the Next.js static export
2. Sync files to S3 bucket
3. Update S3 routing rules (if changed)
4. Invalidate CloudFront cache

**Implementation:**

- [ ] **Create deployment script** - Add `scripts/deploy.sh`:
  ```bash
  #!/bin/bash
  set -e

  S3_BUCKET="mscottford.com"
  CLOUDFRONT_DISTRIBUTION_ID="EXXXXXXXXXX"

  # Build the site
  echo "Building site..."
  pnpm build

  # Sync to S3 (delete files that no longer exist)
  echo "Syncing to S3..."
  aws s3 sync out/ s3://$S3_BUCKET/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "*.html" \
    --exclude "feed.xml"

  # HTML files with shorter cache (for updates)
  aws s3 sync out/ s3://$S3_BUCKET/ \
    --exclude "*" \
    --include "*.html" \
    --include "feed.xml" \
    --cache-control "public, max-age=0, must-revalidate"

  # Invalidate CloudFront cache
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
    --paths "/*"

  echo "Deployment complete!"
  ```

- [ ] **GitHub Actions workflow** - Add `.github/workflows/deploy.yml`:
  ```yaml
  name: Deploy to S3

  on:
    push:
      branches: [main]
    workflow_dispatch:

  jobs:
    deploy:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
          with:
            fetch-depth: 0  # Full history for git log dates

        - uses: pnpm/action-setup@v2
          with:
            version: 8

        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'pnpm'

        - name: Install dependencies
          run: pnpm install

        - name: Build
          run: pnpm build
          env:
            NEXT_PUBLIC_SITE_URL: https://mscottford.com

        - name: Configure AWS credentials
          uses: aws-actions/configure-aws-credentials@v4
          with:
            aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
            aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
            aws-region: us-east-1

        - name: Sync to S3
          run: |
            aws s3 sync out/ s3://${{ secrets.S3_BUCKET }}/ \
              --delete \
              --cache-control "public, max-age=31536000, immutable" \
              --exclude "*.html" \
              --exclude "feed.xml"
            aws s3 sync out/ s3://${{ secrets.S3_BUCKET }}/ \
              --exclude "*" \
              --include "*.html" \
              --include "feed.xml" \
              --cache-control "public, max-age=0, must-revalidate"

        - name: Invalidate CloudFront
          run: |
            aws cloudfront create-invalidation \
              --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} \
              --paths "/*"
  ```

- [ ] **Configure GitHub secrets** - Add to repository settings:
  - `AWS_ACCESS_KEY_ID` - IAM user access key
  - `AWS_SECRET_ACCESS_KEY` - IAM user secret key
  - `S3_BUCKET` - Bucket name (e.g., `mscottford.com`)
  - `CLOUDFRONT_DISTRIBUTION_ID` - Distribution ID (e.g., `EXXXXXXXXXX`)

- [ ] **Create IAM user for deployment** - With minimal permissions:
  ```json
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:PutObject",
          "s3:GetObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          "arn:aws:s3:::mscottford.com",
          "arn:aws:s3:::mscottford.com/*"
        ]
      },
      {
        "Effect": "Allow",
        "Action": "cloudfront:CreateInvalidation",
        "Resource": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
      }
    ]
  }
  ```

- [ ] **Add npm script** - In `package.json`:
  ```json
  {
    "scripts": {
      "deploy": "./scripts/deploy.sh"
    }
  }
  ```

**Cache strategy:**
- Static assets (JS, CSS, images): Long cache (`max-age=31536000, immutable`)
- HTML files: No cache (`max-age=0, must-revalidate`) - CloudFront serves fresh content
- RSS feed: No cache - Always fresh for feed readers

**CloudFront invalidation notes:**
- First 1,000 invalidation paths per month are free
- Wildcard `/*` counts as one path
- Invalidations typically complete in 1-2 minutes

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

- [ ] `src/app/layout.tsx` - Site metadata
  - [ ] Page title template ("Spencer Sharp")
  - [ ] Meta description

- [ ] `src/app/thank-you/page.tsx` - Newsletter confirmation
  - [ ] Thank you message text

### Components

- [ ] `src/components/Footer.tsx`
  - [ ] Copyright name ("Spencer Sharp")

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
