import type { Preview } from '@storybook/nextjs-vite'
import { setCurrentDate } from '../src/lib/currentDate'
import '../src/styles/tailwind.css'

// The footer renders the current year, so without pinning the date every page
// snapshot would report a diff the first time a build runs in a new year.
// Midday UTC rather than midnight, so the year is the same whatever timezone
// the snapshot is taken in.
const STORY_DATE = '2026-07-01T12:00:00Z'

// Set at module scope as well as in the decorator below, so anything that reads
// the date while modules are evaluating sees the pinned value too.
setCurrentDate(new Date(STORY_DATE))

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#18181b' },
      ],
    },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        icon: 'circlehollow',
        items: [
          { value: 'light', icon: 'sun', title: 'Light' },
          { value: 'dark', icon: 'moon', title: 'Dark' },
        ],
        showName: true,
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    // Runs before the story renders, so a story can pin its own date with
    // `parameters: { mockDate: '2030-01-01T12:00:00Z' }`.
    (Story, context) => {
      setCurrentDate(new Date(context.parameters.mockDate ?? STORY_DATE))
      return <Story />
    },
    (Story, context) => {
      const theme = context.globals.theme || 'light'
      return (
        <div className={theme === 'dark' ? 'dark bg-zinc-900' : 'bg-white'}>
          <Story />
        </div>
      )
    },
  ],
}

export default preview
