import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Uses from '@/app/uses/page'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'
import { atViewport, defaultPageViewport } from '../../../.storybook/viewports'

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
