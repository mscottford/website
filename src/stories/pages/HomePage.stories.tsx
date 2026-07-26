import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import Home from '@/app/page'
import {
  mockPosts,
  type Post,
} from '../../../.storybook/mocks/content-collections'
import { mockShowHiddenContent } from '../../../.storybook/mocks/showHiddenContent'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'
import {
  atViewport,
  combine,
  defaultPageViewport,
} from '../../../.storybook/viewports'
import { togglesToDarkTheme } from '../../../.storybook/interactions'

/** Builds a post from the handful of fields the home page actually reads. */
function samplePost(post: {
  slug: string
  title: string
  description: string
  createdAt: string
}): Post {
  const directory = post.createdAt.slice(0, 10)
  return {
    ...post,
    dateTime: post.createdAt,
    lastModifiedAt: post.createdAt,
    _meta: {
      filePath: `${directory}/${post.slug}.mdx`,
      fileName: `${post.slug}.mdx`,
      directory,
      extension: 'mdx',
      path: `${directory}/${post.slug}`,
    },
  }
}

const samplePosts: Post[] = [
  samplePost({
    slug: 'modern-web-development',
    title: 'Building Modern Web Applications with Next.js',
    description:
      'An exploration of modern web development practices using Next.js, React, and TypeScript. Learn how to build performant, scalable applications.',
    createdAt: '2025-01-10T00:00:00.000Z',
  }),
  samplePost({
    slug: 'typescript-best-practices',
    title: 'TypeScript Best Practices for Large Codebases',
    description:
      'Strategies and patterns for maintaining type safety and developer experience in large TypeScript projects.',
    createdAt: '2024-12-15T00:00:00.000Z',
  }),
  samplePost({
    slug: 'testing-strategies',
    title: 'Effective Testing Strategies for React Applications',
    description:
      'A comprehensive guide to testing React applications, from unit tests to integration tests and visual regression testing.',
    createdAt: '2024-11-20T00:00:00.000Z',
  }),
  samplePost({
    slug: 'reading-legacy-code',
    title: 'Reading Legacy Code Without Losing Your Mind',
    description:
      'Techniques for building a mental model of an unfamiliar codebase before you change a single line of it.',
    createdAt: '2024-10-02T00:00:00.000Z',
  }),
]

/**
 * Reveals everything the site keeps behind `showHiddenContent()`.
 *
 * That flag is not scoped to the resume column. Turning it on also un-hides
 * the nav items marked hidden — About, Projects, Speaking and Uses — in both
 * the header and the footer, so this shows nine dashed purple outlines rather
 * than one. The outline is the site's marker for content that isn't live yet.
 *
 * Not captured by Chromatic. What's behind the flag is unfinished: the resume
 * is still the template's placeholder, and the outlines are a development
 * affordance nobody visiting the site sees. Baselining it would spend
 * snapshots on a view that never ships and churn them whenever an unfinished
 * page changes. Remove `chromatic.disable` to start capturing it.
 */
const withHiddenContent = {
  parameters: { showHiddenContent: true, chromatic: { disable: true } },
}

/** Renders with nothing published yet. */
const withNoPosts = { parameters: { posts: [] as Post[] } }

/**
 * The home page — the real route component from `src/app/page.tsx`, not a copy
 * of it.
 *
 * The route reads its posts from content collections and asks
 * `showHiddenContent()` whether to render the resume column, so both of those
 * modules are aliased to stand-ins for Storybook and set per story here. That
 * keeps the snapshots off the real published posts, which would otherwise
 * change every time something is written, while still exercising the page
 * itself. It is an async server component, hence `react: { rsc: true }`, which
 * renders it inside a Suspense boundary.
 */
const meta: Meta<typeof Home> = {
  title: 'Pages/Home',
  component: Home,
  parameters: {
    layout: 'fullscreen',
    react: { rsc: true },
    ...defaultPageViewport.parameters,
  },
  globals: defaultPageViewport.globals,
  tags: ['autodocs'],
  decorators: [withPageLayout],
  beforeEach: async ({ parameters }) => {
    const restorePosts = mockPosts(parameters.posts ?? samplePosts)
    const restoreHidden = mockShowHiddenContent(
      parameters.showHiddenContent ?? false,
    )
    return () => {
      restoreHidden()
      restorePosts()
    }
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Every content variant is captured at all three viewports, and in both
// themes. `combine` merges the fragments' parameters instead of letting the
// last one overwrite the others. See .storybook/viewports.ts.
export const Mobile: Story = atViewport('mobile')

export const Tablet: Story = atViewport('tablet')

export const Dark: Story = atViewport('desktop', { theme: 'dark' })

export const DarkMobile: Story = atViewport('mobile', { theme: 'dark' })

export const DarkTablet: Story = atViewport('tablet', { theme: 'dark' })

// Clicks the header toggle and checks the page switches to dark.
export const ThemeToggle: Story = {
  play: togglesToDarkTheme,
}

/**
 * The site as it looks locally, with the unfinished content showing: the
 * resume column in a second `lg:` column beside the articles, and the hidden
 * nav items back in the header and footer. See `withHiddenContent` above for
 * why these aren't captured by Chromatic.
 */
export const WithHiddenContent: Story = withHiddenContent

export const WithHiddenContentMobile: Story = combine(
  withHiddenContent,
  atViewport('mobile'),
)

export const WithHiddenContentTablet: Story = combine(
  withHiddenContent,
  atViewport('tablet'),
)

export const WithHiddenContentDark: Story = combine(
  withHiddenContent,
  atViewport('desktop', { theme: 'dark' }),
)

export const WithHiddenContentDarkMobile: Story = combine(
  withHiddenContent,
  atViewport('mobile', { theme: 'dark' }),
)

export const WithHiddenContentDarkTablet: Story = combine(
  withHiddenContent,
  atViewport('tablet', { theme: 'dark' }),
)

export const NoArticles: Story = withNoPosts

export const NoArticlesMobile: Story = combine(
  withNoPosts,
  atViewport('mobile'),
)

export const NoArticlesTablet: Story = combine(
  withNoPosts,
  atViewport('tablet'),
)

export const NoArticlesDark: Story = combine(
  withNoPosts,
  atViewport('desktop', { theme: 'dark' }),
)

export const NoArticlesDarkMobile: Story = combine(
  withNoPosts,
  atViewport('mobile', { theme: 'dark' }),
)

export const NoArticlesDarkTablet: Story = combine(
  withNoPosts,
  atViewport('tablet', { theme: 'dark' }),
)
