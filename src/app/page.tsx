import { allPosts } from 'content-collections'

import { HomePage } from '@/components/HomePage'
import { showHiddenContent } from '@/lib/showHiddenContent'

export default async function Home() {
  const articles = [...allPosts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 4)

  return <HomePage articles={articles} showResume={showHiddenContent()} />
}
