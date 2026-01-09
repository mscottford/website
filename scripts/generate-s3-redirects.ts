/**
 * Generates S3 routing rules for redirecting old Tumblr URLs to new article URLs.
 *
 * Usage: pnpm exec ts-node --esm scripts/generate-s3-redirects.ts
 *
 * Outputs:
 *   - deploy/terraform/s3-routing-rules.json (for Terraform)
 *   - Also prints rules to stdout for verification
 */

import { allPosts } from '../.content-collections/generated/index.js'
import * as fs from 'node:fs'
import * as path from 'node:path'

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

// Write routing rules JSON for Terraform
const outputPath = path.join(
  import.meta.dirname,
  '../deploy/terraform/s3-routing-rules.json'
)
fs.writeFileSync(outputPath, JSON.stringify(rules, null, 2))

console.log(`Generated ${rules.length} routing rules`)
console.log(`Written to: ${outputPath}`)
console.log('')
console.log('Rules:')
for (const rule of rules) {
  console.log(`  /${rule.Condition.KeyPrefixEquals}* -> /${rule.Redirect.ReplaceKeyWith}`)
}
