import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Speaking from '@/app/speaking/page'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'

/**
 * The Speaking page groups conference talks and podcast appearances into
 * sections, each entry linking out to the recording.
 *
 * The page renders entirely from data held in the module, so the real page
 * component is imported here rather than reproduced.
 */
const meta: Meta<typeof Speaking> = {
  title: 'Pages/Speaking',
  component: Speaking,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [withPageLayout],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
