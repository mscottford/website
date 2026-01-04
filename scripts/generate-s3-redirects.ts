/**
 * Generates S3 routing rules for redirecting old Tumblr URLs to new article URLs.
 *
 * Usage: pnpm exec ts-node --esm scripts/generate-s3-redirects.ts
 *
 * Output can be used with:
 *   aws s3api put-bucket-website --bucket mscottford.com --website-configuration file://s3-website-config.json
 */

import { allPosts } from 'content-collections'

interface S3RoutingRule {
  Condition: { KeyPrefixEquals: string }
  Redirect: {
    HttpRedirectCode: string
    ReplaceKeyWith: string
  }
}

const rules: S3RoutingRule[] = []

// Generate redirects for imported Tumblr posts
for (const post of allPosts) {
  if (post.tumblrId) {
    rules.push({
      Condition: { KeyPrefixEquals: `post/${post.tumblrId}` },
      Redirect: {
        HttpRedirectCode: '301',
        ReplaceKeyWith: `articles/${post.slug}/`,
      },
    })
  }
}

// Add static redirects
rules.push(
  {
    Condition: { KeyPrefixEquals: 'rss' },
    Redirect: { HttpRedirectCode: '301', ReplaceKeyWith: 'feed.xml' },
  },
  {
    Condition: { KeyPrefixEquals: 'archive' },
    Redirect: { HttpRedirectCode: '301', ReplaceKeyWith: 'articles/' },
  }
)

const config = {
  IndexDocument: { Suffix: 'index.html' },
  ErrorDocument: { Key: '404.html' },
  RoutingRules: rules,
}

console.log(JSON.stringify(config, null, 2))
