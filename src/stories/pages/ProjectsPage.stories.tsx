import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Projects from '@/app/projects/page'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'

/**
 * The Projects page lists the things I've built, each shown as a card with a
 * logo, a short description, and a link to where the code lives.
 *
 * The page renders entirely from data held in the module, so the real page
 * component is imported here rather than reproduced.
 */
const meta: Meta<typeof Projects> = {
  title: 'Pages/Projects',
  component: Projects,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [withPageLayout],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
