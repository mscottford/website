import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import NotFound from '@/app/not-found'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'

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
  },
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
