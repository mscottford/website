/**
 * Stand-in for `@/lib/showHiddenContent`, aliased in place of the real one for
 * Storybook builds only (see `viteFinal` in main.ts).
 *
 * The real one answers `process.env.NODE_ENV === 'development'`, which would
 * mean the home page's resume column appears when Storybook is run with `pnpm
 * storybook` and vanishes from the built Storybook that Chromatic captures.
 * Fixing it to `false` makes that deterministic, and a story that wants the
 * hidden content can ask for it.
 */
let hiddenContentVisible = false

export function showHiddenContent(): boolean {
  return hiddenContentVisible
}

/** Show hidden content. Returns a function that restores the default. */
export function mockShowHiddenContent(visible: boolean) {
  const previous = hiddenContentVisible
  hiddenContentVisible = visible
  return () => {
    hiddenContentVisible = previous
  }
}
