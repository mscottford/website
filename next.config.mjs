import { withContentCollections } from '@content-collections/next'
import nextMDX from '@next/mdx'

const __dirname = new URL('.', import.meta.url).pathname

const staticExportOptions =
  process.env.STATIC_EXPORT !== 'false'
    ? {
        output: 'export',
        trailingSlash: true,
        images: {
          unoptimized: true,
        },
      }
    : {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...staticExportOptions,

  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  outputFileTracingIncludes: {
    '/articles/*': ['./src/app/articles/**/*.mdx'],
  },

  turbopack: {
    root: __dirname,
  },
  outputFileTracingRoot: __dirname,
}

// Turbopack passes loader options across a process boundary, so plugins must
// be named by module specifier rather than imported as functions.
const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [
      'remark-gfm',
      'remark-frontmatter',
      'remark-mdx-frontmatter',
      `${__dirname}scripts/remark-post-images.ts`,
    ],
    rehypePlugins: ['@mapbox/rehype-prism'],
  },
})

export default withContentCollections(withMDX(nextConfig))
