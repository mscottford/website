import { allPosts } from "content-collections";
import { notFound } from "next/navigation";
import { Prose } from '@/components/Prose'
import { formatDate } from "@/lib/formatDate";

export default async function Article({ params }: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params;
  const article = allPosts.find((post) => post.slug === slug);
  if (!article) {
    return notFound();
  }

  const { default: Content } = await import(`../../../../content/posts/${article._meta.filePath}`);

  return (
    <article>
      <header className="flex flex-col">
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          {article.title}
        </h1>
        <time
          dateTime={article.createdAt}
          className="order-first flex items-center text-base text-zinc-400 dark:text-zinc-500"
        >
          <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
          <span className="ml-3">{formatDate(article.createdAt)}</span>
        </time>
      </header>
      <Prose className="mt-8" data-mdx-content>
        <Content />
      </Prose>
    </article>
  );
}

export function generateStaticParams() {
  return allPosts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false
