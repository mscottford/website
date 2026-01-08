import { withContentCollections } from '@content-collections/next'
import rehypePrism from '@mapbox/rehype-prism'
import nextMDX from '@next/mdx'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkPostImages from './scripts/remark-post-images.ts'

const __dirname = new URL('.', import.meta.url).pathname;

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

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter, remarkPostImages],
    rehypePlugins: [rehypePrism],
  },
})

export default withContentCollections(withMDX(nextConfig))
