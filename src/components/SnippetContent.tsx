import Link from 'next/link'
import { getSnippet } from '@/lib/snippets'

interface SnippetContentProps {
  name: string
}

export function SnippetContent({ name }: SnippetContentProps) {
  const content = getSnippet(name)

  // Parse markdown links and split into parts
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: Array<{ type: 'text'; value: string } | { type: 'link'; text: string; href: string }> = []

  let lastIndex = 0
  let match

  while ((match = linkRegex.exec(content)) !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: content.slice(lastIndex, match.index) })
    }

    // Add the link
    parts.push({ type: 'link', text: match[1], href: match[2] })

    lastIndex = match.index + match[0].length
  }

  // Add remaining text after the last link
  if (lastIndex < content.length) {
    parts.push({ type: 'text', value: content.slice(lastIndex) })
  }

  return (
    <>
      {parts.map((part, index) => {
        if (part.type === 'text') {
          return <span key={index}>{part.value}</span>
        }
        return (
          <Link key={index} href={part.href}>
            {part.text}
          </Link>
        )
      })}
    </>
  )
}
