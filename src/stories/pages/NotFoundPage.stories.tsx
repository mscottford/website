import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import NotFound from '@/app/not-found'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'
import { atViewport, defaultPageViewport } from '../../../.storybook/viewports'
import { togglesToDarkTheme } from '../../../.storybook/interactions'

/**
 * The 404 page, shown for any route that doesn't resolve. It is the only
 * page that centres its content vertically, so it is worth snapshotting to
 * catch layout regressions in the surrounding shell.
 */
const meta: Meta<typeof NotFound> = {
  title: 'Pages/Not Found',
  component: NotFound,
  parameters: {
    layout: 'fullscreen',
    ...defaultPageViewport.parameters,
  },
  globals: defaultPageViewport.globals,
  tags: ['autodocs'],
  decorators: [withPageLayout],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * Every page renders the footer's copyright year, which the preview pins so
 * snapshots don't drift when the year changes. This story overrides the pinned
 * date to show that the seam works — the footer below should read 2030. It is
 * the smallest page on the site, so it is the cheapest place to prove it.
 */
export const PinnedToADifferentYear: Story = {
  parameters: {
    mockDate: '2030-07-01T12:00:00Z',
  },
}

// The same page at the other two viewports. See .storybook/viewports.ts
// for why each width was picked and how Chromatic captures it.
export const Mobile: Story = atViewport('mobile')

export const Tablet: Story = atViewport('tablet')

// Dark mode is applied by a decorator that adds the `dark` class to a wrapper,
// so it lives in the rendered DOM and Chromatic captures it from the story
// globals alone. See the note in .storybook/viewports.ts.
export const Dark: Story = atViewport('desktop', { theme: 'dark' })

export const DarkMobile: Story = atViewport('mobile', { theme: 'dark' })

export const DarkTablet: Story = atViewport('tablet', { theme: 'dark' })

// Clicks the header toggle and checks the page switches to dark.
export const ThemeToggle: Story = {
  play: togglesToDarkTheme,
}
