type ArticleJsonLdProps = {
  title: string
  description: string
  createdAt: string
  lastModifiedAt: string
  slug: string
}

export function ArticleJsonLd({
  title,
  description,
  createdAt,
  lastModifiedAt,
  slug,
}: ArticleJsonLdProps) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mscottford.com'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: description,
    datePublished: createdAt,
    dateModified: lastModifiedAt,
    url: `${siteUrl}/articles/${slug}`,
    author: {
      '@type': 'Person',
      name: 'M. Scott Ford',
      url: `${siteUrl}/about`,
    },
    publisher: {
      '@type': 'Person',
      name: 'M. Scott Ford',
      url: siteUrl,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
