import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { HomePage, type HomePageArticle } from '@/components/HomePage'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'
import { atViewport, defaultPageViewport } from '../../../.storybook/viewports'
import { togglesToDarkTheme } from '../../../.storybook/interactions'

const sampleArticles: HomePageArticle[] = [
  {
    slug: 'modern-web-development',
    title: 'Building Modern Web Applications with Next.js',
    description:
      'An exploration of modern web development practices using Next.js, React, and TypeScript. Learn how to build performant, scalable applications.',
    createdAt: '2025-01-10',
  },
  {
    slug: 'typescript-best-practices',
    title: 'TypeScript Best Practices for Large Codebases',
    description:
      'Strategies and patterns for maintaining type safety and developer experience in large TypeScript projects.',
    createdAt: '2024-12-15',
  },
  {
    slug: 'testing-strategies',
    title: 'Effective Testing Strategies for React Applications',
    description:
      'A comprehensive guide to testing React applications, from unit tests to integration tests and visual regression testing.',
    createdAt: '2024-11-20',
  },
  {
    slug: 'reading-legacy-code',
    title: 'Reading Legacy Code Without Losing Your Mind',
    description:
      'Techniques for building a mental model of an unfamiliar codebase before you change a single line of it.',
    createdAt: '2024-10-02',
  },
]

/**
 * The home page.
 *
 * The route itself is an async server component that reads its articles from
 * content collections, so the markup lives in `HomePage` and the route is a
 * thin wrapper that fetches and passes them in. These stories render that
 * component directly, with a fixed article list so the snapshots don't change
 * every time a post is published.
 *
 * The tagline, teaser, social links and photos are not props — they come from
 * content collections and the image imports, exactly as they do on the site.
 */
const meta: Meta<typeof HomePage> = {
  title: 'Pages/Home',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
    ...defaultPageViewport.parameters,
  },
  globals: defaultPageViewport.globals,
  tags: ['autodocs'],
  decorators: [withPageLayout],
  args: {
    articles: sampleArticles,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Every content variant is captured at all three viewports. Each variant's
// mobile and tablet stories are composed from the variant itself, so the two
// can't drift apart. See .storybook/viewports.ts for why each width was picked
// and how Chromatic captures it.
export const Mobile: Story = atViewport('mobile')

export const Tablet: Story = atViewport('tablet')

// Dark mode is applied by a decorator that adds the `dark` class to a wrapper,
// so it lives in the rendered DOM and Chromatic captures it from the story
// globals alone. See the note in .storybook/viewports.ts.
export const Dark: Story = atViewport('desktop', { theme: 'dark' })

export const DarkMobile: Story = atViewport('mobile', { theme: 'dark' })

export const DarkTablet: Story = atViewport('tablet', { theme: 'dark' })

// Clicks the header toggle and checks the page switches to dark.
export const ThemeToggle: Story = {
  play: togglesToDarkTheme,
}

/**
 * The resume panel is only rendered in development, where it sits in a second
 * column beside the articles. That second column is a `lg:` layout, so the
 * mobile and tablet stories are where you see it stack instead.
 */
export const WithResume: Story = {
  args: {
    showResume: true,
  },
}

export const WithResumeMobile: Story = {
  ...WithResume,
  ...atViewport('mobile'),
}

export const WithResumeTablet: Story = {
  ...WithResume,
  ...atViewport('tablet'),
}

export const WithResumeDark: Story = {
  ...WithResume,
  ...atViewport('desktop', { theme: 'dark' }),
}

export const WithResumeDarkMobile: Story = {
  ...WithResume,
  ...atViewport('mobile', { theme: 'dark' }),
}

export const WithResumeDarkTablet: Story = {
  ...WithResume,
  ...atViewport('tablet', { theme: 'dark' }),
}

export const NoArticles: Story = {
  args: {
    articles: [],
  },
}

export const NoArticlesMobile: Story = {
  ...NoArticles,
  ...atViewport('mobile'),
}

export const NoArticlesTablet: Story = {
  ...NoArticles,
  ...atViewport('tablet'),
}

export const NoArticlesDark: Story = {
  ...NoArticles,
  ...atViewport('desktop', { theme: 'dark' }),
}

export const NoArticlesDarkMobile: Story = {
  ...NoArticles,
  ...atViewport('mobile', { theme: 'dark' }),
}

export const NoArticlesDarkTablet: Story = {
  ...NoArticles,
  ...atViewport('tablet', { theme: 'dark' }),
}
