import * as real from '../../.content-collections/generated'

export type {
  Post,
  SocialLink,
  NavItem,
  Snippet,
} from '../../.content-collections/generated'

/**
 * Stand-in for the `content-collections` module, aliased in place of the real
 * one for Storybook builds only (see `viteFinal` in main.ts).
 *
 * Everything defaults to the real generated content, so stories look like the
 * site does and nothing changes just because this file exists. What it adds is
 * a way to substitute the posts, which is what makes the home and articles
 * pages renderable as stories: they read their content straight out of this
 * module, so supplying it here means the real page component can be rendered
 * rather than reimplemented.
 *
 * `allPosts` is exported with `let` on purpose. ES module bindings are live, so
 * reassigning it here is visible to modules that imported it, which lets a
 * story swap the posts before it renders without anything having to be
 * threaded through props.
 */
export let allPosts: (typeof real)['allPosts'] = real.allPosts

export const { allSocialLinks, allNavItems, allSnippets } = real

/** Swap the posts. Returns a function that puts the real ones back. */
export function mockPosts(posts: (typeof real)['allPosts']) {
  const previous = allPosts
  allPosts = posts
  return () => {
    allPosts = previous
  }
}
