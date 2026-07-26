import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Speaking from '@/app/speaking/page'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'
import { atViewport, defaultPageViewport } from '../../../.storybook/viewports'

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
    ...defaultPageViewport.parameters,
  },
  globals: defaultPageViewport.globals,
  tags: ['autodocs'],
  decorators: [withPageLayout],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// The same page at the other two viewports. See .storybook/viewports.ts
// for why each width was picked and how Chromatic captures it.
export const Mobile: Story = atViewport('mobile')

export const Tablet: Story = atViewport('tablet')

// Dark mode is applied by a decorator that adds the `dark` class to a wrapper,
// so it lives in the rendered DOM and Chromatic captures it from the story
// globals alone. One dark story per page covers the components that page
// renders; see the note in .storybook/viewports.ts.
export const Dark: Story = atViewport('desktop', { theme: 'dark' })
