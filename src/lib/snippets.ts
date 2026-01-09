import { allSnippets } from 'content-collections'

export function getSnippet(name: string): string {
  const snippet = allSnippets.find((s) => s.name === name)
  if (!snippet) {
    throw new Error(`Snippet "${name}" not found`)
  }
  return snippet.content
}

export function getSnippetPlain(name: string): string {
  const snippet = allSnippets.find((s) => s.name === name)
  if (!snippet) {
    throw new Error(`Snippet "${name}" not found`)
  }
  return snippet.plainContent
}
