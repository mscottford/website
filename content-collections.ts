import { defineCollection, defineConfig } from '@content-collections/core'
import util from 'node:util'
import child_process from 'node:child_process';
import { z } from 'zod'

const exec = util.promisify(child_process.exec);

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
  transform: async ({ content: _, ...post }, { cache }) => {
    const lastModifiedAt = await cache(post._meta.filePath, async (filePath) => {
      const { stdout } = await exec(`git log -1 --format=%ai -- ${filePath}`);
      if (stdout) {
        return new Date(stdout.trim()).toISOString();
      }
      return new Date().toISOString();
    });

    const createdAt = new Date(post.dateTime).toISOString();

    // Use filename (without extension) as slug instead of deriving from title
    const slug = post._meta.fileName.replace(/\.mdx$/, '');

    return {
      ...post,
      slug,
      createdAt,
      lastModifiedAt,
    }
  }
});

export default defineConfig({
  collections: [posts],
});
