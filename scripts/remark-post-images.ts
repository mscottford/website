import { visit } from 'unist-util-visit'
import type { Root } from 'mdast'
import type { VFile } from 'vfile'
import path from 'path'

/**
 * Remark plugin that transforms relative image paths in MDX files
 * to absolute paths pointing to /images/posts/[date-folder]/[filename]
 */
export default function remarkPostImages() {
  return (tree: Root, file: VFile) => {
    // Get the directory containing the MDX file (e.g., "2024-08-01")
    const filePath = file.path || file.history[0]
    if (!filePath) return

    // Extract the date folder from the file path
    // e.g., content/posts/2024-08-01/some-post.mdx -> 2024-08-01
    const match = filePath.match(/content\/posts\/([^/]+)\//)
    if (!match) return

    const dateFolder = match[1]

    visit(tree, 'image', (node) => {
      if (node.url && node.url.startsWith('./')) {
        // Transform ./image.png to /images/posts/2024-08-01/image.png
        const filename = node.url.slice(2) // Remove "./"
        node.url = `/images/posts/${dateFolder}/${filename}`
      }
    })
  }
}
