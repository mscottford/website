import rehypePrism from '@mapbox/rehype-prism'
import nextMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const staticExportOptions = 
  process.env.STATIC_EXPORT === 'true' ? {
    output: 'export',
    trailingSlash: true,
    basePath: process.env.PAGES_BASE_PATH,
  } : {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...staticExportOptions,

  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'mdx'],
  outputFileTracingIncludes: {
    '/articles/*': ['./src/app/articles/**/*.mdx'],
  },
}

const withMDX = nextMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypePrism],
  },
})

export default withMDX(nextConfig)
