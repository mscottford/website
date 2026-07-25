import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Uses from '@/app/uses/page'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'

/**
 * The Uses page is a long, sectioned list of the hardware and software I
 * recommend. It is the densest use of `Section` and `Card` on the site.
 *
 * The page renders entirely from data held in the module, so the real page
 * component is imported here rather than reproduced.
 */
const meta: Meta<typeof Uses> = {
  title: 'Pages/Uses',
  component: Uses,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [withPageLayout],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
