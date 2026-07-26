import { dirname, resolve as resolvePath } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/nextjs-vite'
import type { Plugin } from 'vite'

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url))

// Compared without extensions, because that is how these arrive.
const realContentCollections = here('../.content-collections/generated')
const realShowHiddenContent = here('../src/lib/showHiddenContent')

const mockContentCollections = here('./mocks/content-collections.ts')
const mockShowHiddenContent = here('./mocks/showHiddenContent.ts')

/**
 * Redirects the two modules that decide what a page contains to stand-ins, so
 * a story can render a real page component with content it controls instead of
 * reimplementing the page. Both stand-ins default to the real behaviour, so
 * this only changes anything where a story asks it to. See ./mocks.
 *
 * Two things make this fiddlier than a `resolve.alias` entry would suggest.
 * Both modules are reached through tsconfig paths, and `vite-tsconfig-paths`
 * runs as a `pre` plugin — ahead of Vite's own alias step — so an alias for
 * either is never consulted. It also rewrites the specifiers before this
 * plugin sees them: `content-collections` arrives as a relative path to the
 * generated directory. So rather than matching the specifier as written, this
 * resolves it against the importer and compares the result.
 */
const mockPageData: Plugin = {
  name: 'storybook:mock-page-data',
  enforce: 'pre',
  resolveId(source, importer) {
    if (!importer) return null

    // The stand-ins import the real modules to re-export them; sending those
    // back to the stand-ins would be a cycle.
    const from = importer.split('?')[0]
    if (from === mockContentCollections || from === mockShowHiddenContent) {
      return null
    }

    const target =
      source === 'content-collections' || source === '@/lib/showHiddenContent'
        ? source
        : resolvePath(dirname(from), source)

    if (target === 'content-collections' || target === realContentCollections) {
      return mockContentCollections
    }
    if (
      target === '@/lib/showHiddenContent' ||
      target === realShowHiddenContent
    ) {
      return mockShowHiddenContent
    }
    return null
  },
}

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@chromatic-com/storybook',
  ],
  framework: '@storybook/nextjs-vite',
  viteFinal: async (viteConfig) => ({
    ...viteConfig,
    plugins: [mockPageData, ...(viteConfig.plugins ?? [])],
  }),
}

export default config
