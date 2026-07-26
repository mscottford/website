import type { Viewport } from 'storybook/viewport'

/**
 * The viewports the page stories are captured at.
 *
 * Chosen to sit either side of the Tailwind breakpoints this site actually
 * changes layout at, rather than to match particular devices:
 *
 * - `mobile` (375px) is below `sm`. Mobile nav, everything in one column.
 * - `tablet` (768px) is exactly `md`, where the desktop nav replaces the mobile
 *   one, the article list gains its date column, and the footer becomes a row.
 * - `desktop` (1280px) is `xl`, which brings in the `lg` two-column layouts on
 *   the home and about pages and the three-up project grid.
 *
 * Heights are generous because the stories are full pages; Chromatic captures
 * the whole document regardless, and the height only affects what you see in
 * the Storybook preview pane.
 */
export const pageViewports = {
  mobile: {
    name: 'Mobile (375px)',
    styles: { width: '375px', height: '900px' },
    type: 'mobile',
  },
  tablet: {
    name: 'Tablet (768px)',
    styles: { width: '768px', height: '1024px' },
    type: 'tablet',
  },
  desktop: {
    name: 'Desktop (1280px)',
    styles: { width: '1280px', height: '1024px' },
    type: 'desktop',
  },
} satisfies Record<string, Viewport>

export type PageViewport = keyof typeof pageViewports

function widthOf(viewport: PageViewport): number {
  return Number.parseInt(pageViewports[viewport].styles.width, 10)
}

/**
 * Story (or meta) fields that render at one of the viewports above, optionally
 * in the dark theme.
 *
 * The viewport needs both halves, and they do different jobs.
 * `globals.viewport` sizes the preview pane so the story can be looked at in
 * Storybook, while `chromatic.viewports` sets the width Chromatic captures at —
 * Chromatic does not read the viewport addon's settings, so without the second
 * half every snapshot would come out at the same default width no matter what
 * the toolbar said.
 *
 * The theme needs only the global. It is applied by a decorator that puts the
 * `dark` class on a wrapper element, so it is part of the rendered DOM and
 * Chromatic captures it without being told anything.
 */
export function atViewport(
  viewport: PageViewport,
  { theme }: { theme?: 'light' | 'dark' } = {},
) {
  return {
    globals: {
      viewport: { value: viewport },
      ...(theme ? { theme } : {}),
    },
    parameters: { chromatic: { viewports: [widthOf(viewport)] } },
  }
}

/**
 * The viewport a page meta defaults to, so every story on the page is captured
 * at a known width rather than whatever Chromatic happens to default to.
 *
 * Spread the halves into the meta's own `parameters` and `globals` properties:
 *
 *     parameters: {
 *       layout: 'fullscreen',
 *       ...defaultPageViewport.parameters,
 *     },
 *     globals: defaultPageViewport.globals,
 *
 * Do not collapse that into a single `...defaultPageViewport` spread on the
 * meta. When a meta carries a JSDoc comment, Storybook's docgen appends a
 * `parameters` property to the object to hold the description, which silently
 * replaces anything a spread put there. It merges correctly into an explicit
 * `parameters` literal, so keep one.
 */
export const defaultPageViewport = atViewport('desktop')
