import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SimpleLayout } from '@/components/SimpleLayout'
import { Card } from '@/components/Card'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

interface Article {
  slug: string
  title: string
  description: string
  dateTime: string
}

const sampleArticles: Article[] = [
  {
    slug: 'modern-web-development',
    title: 'Building Modern Web Applications with Next.js',
    description:
      'An exploration of modern web development practices using Next.js, React, and TypeScript. Learn how to build performant, scalable applications.',
    dateTime: '2025-01-10',
  },
  {
    slug: 'typescript-best-practices',
    title: 'TypeScript Best Practices for Large Codebases',
    description:
      'Strategies and patterns for maintaining type safety and developer experience in large TypeScript projects.',
    dateTime: '2024-12-15',
  },
  {
    slug: 'testing-strategies',
    title: 'Effective Testing Strategies for React Applications',
    description:
      'A comprehensive guide to testing React applications, from unit tests to integration tests and visual regression testing.',
    dateTime: '2024-11-20',
  },
]

function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/articles/${article.slug}`}>{article.title}</Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={article.dateTime}
          className="md:hidden"
          decorate
        >
          {formatDate(article.dateTime)}
        </Card.Eyebrow>
        <Card.Description>{article.description}</Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>
      <Card.Eyebrow
        as="time"
        dateTime={article.dateTime}
        className="mt-1 max-md:hidden"
      >
        {formatDate(article.dateTime)}
      </Card.Eyebrow>
    </article>
  )
}

/**
 * The Articles page displays a list of blog posts with their
 * titles, dates, and descriptions.
 */
function ArticlesPage({ articles = sampleArticles }: { articles?: Article[] }) {
  return (
    <SimpleLayout
      title="Writing on software mending, programming, and some random bits just for fun."
      intro="All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order."
    >
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {articles.map((article) => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </SimpleLayout>
  )
}

const meta: Meta<typeof ArticlesPage> = {
  title: 'Pages/Articles',
  component: ArticlesPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [withPageLayout],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const SingleArticle: Story = {
  args: {
    articles: [sampleArticles[0]],
  },
}

export const Empty: Story = {
  args: {
    articles: [],
  },
  render: () => (
    <SimpleLayout
      title="Writing on software mending, programming, and some random bits just for fun."
      intro="All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order."
    >
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          No articles yet. Check back soon!
        </p>
      </div>
    </SimpleLayout>
  ),
}
