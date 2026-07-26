import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ThemeProvider } from 'next-themes'
import { ThemeToggle } from './ThemeToggle'

/**
 * Makes `prefers-color-scheme` report the given scheme for the duration of a
 * story, and puts the real `matchMedia` back afterwards.
 *
 * next-themes reads the OS preference through `matchMedia`, so this is the only
 * way to decide what the "system" half of the comparison is. Without it these
 * stories would report whatever the machine rendering them happens to prefer,
 * which is the very thing that used to make this component unsnapshottable.
 */
function stubSystemPreference(scheme: 'light' | 'dark') {
  const original = window.matchMedia

  window.matchMedia = ((query: string) => {
    if (!query.includes('prefers-color-scheme')) {
      return original.call(window, query)
    }
    return {
      matches: query.includes('dark') ? scheme === 'dark' : scheme === 'light',
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    } as unknown as MediaQueryList
  }) as typeof window.matchMedia

  return () => {
    window.matchMedia = original
  }
}

/**
 * The header's light/dark switch.
 *
 * The icon picks up a teal accent when the theme on screen isn't the one the
 * operating system asked for, so there are four states worth pinning: each
 * theme, following or overriding the system. Both inputs are controlled here —
 * the theme through the provider, the system preference through a `matchMedia`
 * stub — so each story renders the same way on any machine.
 */
const meta: Meta<typeof ThemeToggle> = {
  title: 'Components/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  beforeEach: async ({ parameters }) =>
    stubSystemPreference(parameters.systemPreference ?? 'light'),
  decorators: [
    (Story, { parameters }) => (
      <ThemeProvider
        attribute="class"
        defaultTheme={parameters.siteTheme ?? 'light'}
        enableSystem
        disableTransitionOnChange
      >
        <Story />
      </ThemeProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

/** Light theme on a machine that asks for light: the plain zinc sun. */
export const FollowingSystem: Story = {
  parameters: { siteTheme: 'light', systemPreference: 'light' },
}

/** Light theme on a machine that asks for dark: the sun picks up the accent. */
export const OverridingSystem: Story = {
  parameters: { siteTheme: 'light', systemPreference: 'dark' },
}

/** Dark theme on a machine that asks for dark: the plain zinc moon. */
export const DarkFollowingSystem: Story = {
  parameters: { siteTheme: 'dark', systemPreference: 'dark' },
  globals: { theme: 'dark' },
}

/** Dark theme on a machine that asks for light: the moon picks up the accent. */
export const DarkOverridingSystem: Story = {
  parameters: { siteTheme: 'dark', systemPreference: 'light' },
  globals: { theme: 'dark' },
}
