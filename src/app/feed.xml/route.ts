import assert from 'assert'
import * as cheerio from 'cheerio'
import { allPosts } from 'content-collections'
import { Feed } from 'feed'

export const dynamic = 'force-static'

export async function GET(req: Request) {
  const ReactDOMServer = (await import('react-dom/server')).default;

  let siteUrl = process.env.NEXT_PUBLIC_SITE_URL

  if (!siteUrl) {
    throw Error('Missing NEXT_PUBLIC_SITE_URL environment variable')
  }

  const author = {
    name: 'M. Scott Ford',
    email: 'scott@mscottford.com',
  }

  const feed = new Feed({
    title: author.name,
    description: 'Your blog description',
    author,
    id: siteUrl,
    link: siteUrl,
    image: `${siteUrl}/favicon.ico`,
    favicon: `${siteUrl}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}`,
    feedLinks: {
      atom1: `${siteUrl}/feed.xml`,
    },
  })

  const sortedPosts = allPosts
    .sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    });

  for (const post of sortedPosts) {
    const publicUrl = `${siteUrl}/articles/${post.slug}`;

    const { default: Content } = await import(`../../../content/posts/${post._meta.filePath}`);

    const renderedContent = ReactDOMServer.renderToStaticMarkup(Content(), { identifierPrefix: `post-${post.slug}-` });

    feed.addItem({
      title: post.title,
      id: publicUrl,
      link: publicUrl,
      description: post.description,
      content: renderedContent,
      date: new Date(post.createdAt),
      author: [author],
      contributor: [author],
    });
  }

  return new Response(feed.atom1(), {
    status: 200,
    headers: {
      'content-type': 'application/xml',
      'cache-control': 's-maxage=31556952',
    },
  })
}
