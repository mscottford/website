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
