import { type Metadata } from 'next'

import { Card } from '@/components/Card'
import { SimpleLayout } from '@/components/SimpleLayout'
import { formatDate } from '@/lib/formatDate'

import { allPosts, Post } from "content-collections";
import { getSnippetPlain } from '@/lib/snippets'

function Article({ article }: { article: Post }) {
  return (
    <article className="md:grid md:grid-cols-4 md:items-baseline">
      <Card className="md:col-span-3">
        <Card.Title href={`/articles/${article.slug}`}>
          {article.title}
        </Card.Title>
        <Card.Eyebrow
          as="time"
          dateTime={article.createdAt}
          className="md:hidden"
          decorate
        >
          {formatDate(article.createdAt)}
        </Card.Eyebrow>
        <Card.Description>{article.description}</Card.Description>
        <Card.Cta>Read article</Card.Cta>
      </Card>
      <Card.Eyebrow
        as="time"
        dateTime={article.createdAt}
        className="mt-1 max-md:hidden"
      >
        {formatDate(article.createdAt)}
      </Card.Eyebrow>
    </article>
  )
}

export const metadata: Metadata = {
  title: 'Articles',
  description: getSnippetPlain('articles-tagline'),
}

export default async function ArticlesIndex() {
  const sortedPosts = [...allPosts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  return (
    <SimpleLayout
      title="Writing on software mending, programming, and some random bits just for fun."
      intro={getSnippetPlain('articles-tagline')}
    >
      <div className="md:border-l md:border-zinc-100 md:pl-6 md:dark:border-zinc-700/40">
        <div className="flex max-w-3xl flex-col space-y-16">
          {sortedPosts.map((article) => (
            <Article key={article._meta.path} article={article} />
          ))}
        </div>
      </div>
    </SimpleLayout>
  )
}
