import { defineCollection, defineConfig } from '@content-collections/core'
import util from 'node:util'
import child_process from 'node:child_process'
import { z } from 'zod'

const exec = util.promisify(child_process.exec)

function omit<T extends object, K extends keyof T>(value: T, key: K) {
  const copy = { ...value }
  delete copy[key]
  return copy as Omit<T, K>
}

const posts = defineCollection({
  name: 'posts',
  directory: './content/posts',
  include: '**/*.mdx',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    content: z.string(),
    dateTime: z.string(),
    tumblrId: z.string().optional(),
    tumblrSlug: z.string().optional(),
  }),
  transform: async (document, { cache }) => {
    // Pages render posts by importing the MDX directly, so the raw source would
    // only bloat the generated data every page imports.
    const post = omit(document, 'content')

    const lastModifiedAt = await cache(
      post._meta.filePath,
      async (filePath) => {
        // _meta.filePath is relative to the collection directory (content/posts),
        // but git runs from the repo root, so prepend the collection path or git
        // log matches nothing and every post silently falls back to "now".
        const repoPath = `content/posts/${filePath}`
        const { stdout } = await exec(
          `git log -1 --format=%ai -- "${repoPath}"`,
        )
        if (stdout) {
          return new Date(stdout.trim()).toISOString()
        }
        return new Date().toISOString()
      },
    )

    const createdAt = new Date(post.dateTime).toISOString()

    // Use filename (without extension) as slug instead of deriving from title
    const slug = post._meta.fileName.replace(/\.mdx$/, '')

    return {
      ...post,
      slug,
      createdAt,
      lastModifiedAt,
    }
  },
})

const socialLinks = defineCollection({
  name: 'socialLinks',
  directory: './content/social-links',
  include: '**/*.yaml',
  parser: 'yaml',
  schema: z.object({
    platform: z.string(),
    url: z.url(),
    alt: z.string(),
  }),
  transform: async ({ ...link }) => {
    return {
      ...link,
      slug: link.platform.toLowerCase().replace(/ /g, '-'),
    }
  },
})

const navItems = defineCollection({
  name: 'navItems',
  directory: './content/nav-items',
  include: '**/*.yaml',
  parser: 'yaml',
  schema: z.object({
    label: z.string(),
    href: z.string(),
    hidden: z.boolean().optional(),
  }),
})

const snippets = defineCollection({
  name: 'snippets',
  directory: './content/snippets',
  include: '**/*.yaml',
  parser: 'yaml',
  schema: z.object({
    name: z.string(),
    content: z.string(),
  }),
  transform: async (snippet) => {
    // Remove markdown links, keeping just the link text
    const plainContent = snippet.content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    return {
      ...snippet,
      plainContent,
    }
  },
})

export default defineConfig({
  content: [posts, socialLinks, navItems, snippets],
})
