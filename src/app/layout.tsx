import { type Metadata } from 'next'

import { Providers } from '@/app/providers'
import { Layout } from '@/components/Layout'
import { getSnippetPlain } from '@/lib/snippets'

import '@/styles/tailwind.css'

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://mscottford.com',
  ),
  title: {
    template: '%s - M. Scott Ford',
    default:
      `M. Scott Ford - ${getSnippetPlain('tagline')}`,
  },
  description: getSnippetPlain('teaser'),
  alternates: {
    types: {
      'application/rss+xml': `${process.env.NEXT_PUBLIC_SITE_URL}/feed.xml`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'M. Scott Ford',
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@mscottford',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="flex h-full bg-zinc-50 dark:bg-black">
        <Providers>
          <div className="flex w-full">
            <Layout>{children}</Layout>
          </div>
        </Providers>
      </body>
    </html>
  )
}
