import Image, { type ImageProps } from 'next/image'
import { type MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents) {
  return {
    ...components,
    // `alt` is required by ImageProps and forwarded via the spread; the rule
    // just can't see through it.
    // oxlint-disable-next-line jsx-a11y/alt-text
    Image: (props: ImageProps) => <Image {...props} />,
  }
}
