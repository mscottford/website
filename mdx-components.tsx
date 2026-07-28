import Image, { type ImageProps } from 'next/image'
import { type MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents) {
  return {
    ...components,
    // `alt` is required by ImageProps and forwarded via the spread; the rule
    // just can't see through it.
    // oxlint-disable-next-line jsx-a11y/alt-text
    Image: (props: ImageProps) => <Image {...props} />,
    // Code blocks scroll sideways when a line is too long for the column, and
    // a region you can scroll has to be reachable by keyboard — otherwise the
    // only way to read the rest of the line is to drag it with a mouse. This is
    // what axe's `scrollable-region-focusable` asks for; the lint rule opposite
    // it is the general case of not making static content tabbable, which a
    // scrollable region is the documented exception to.
    pre: (props: React.ComponentPropsWithoutRef<'pre'>) => (
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      <pre tabIndex={0} {...props} />
    ),
  }
}
