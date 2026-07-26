import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Container } from '@/components/Container'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'
import { atViewport, defaultPageViewport } from '../../../.storybook/viewports'

// The real page embeds a third-party booking widget from
// NEXT_PUBLIC_CALENDAR_BOOKING_URL. Pointing the story at that URL would make
// every snapshot depend on a third party rendering identically, so the story
// substitutes a local placeholder of the same size. What is being pinned here
// is the surrounding page, not the widget.
const placeholderEmbed = `
  <div style="display:flex;align-items:center;justify-content:center;height:100%;
              font-family:system-ui,sans-serif;font-size:14px;color:#71717a;
              background:#fafafa">
    Booking calendar embed
  </div>
`

/**
 * The Calendar page, where visitors book a meeting.
 *
 * The page has two states, decided at build time by whether the booking URL
 * environment variable is set, and both are worth pinning.
 */
function CalendarPage({ bookingUrl }: { bookingUrl?: string }) {
  if (!bookingUrl) {
    return (
      <Container className="mt-8 sm:mt-16">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          Calendar Unavailable
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          The booking calendar is not currently available.
        </p>
      </Container>
    )
  }

  return (
    <Container className="mt-8 sm:mt-16">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
          Book a Meeting
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          Select a time that works for you using the calendar below.
        </p>
      </header>
      <div className="mt-10 sm:mt-12">
        <div className="relative h-[80vh] min-h-[900px] w-full overflow-hidden rounded-2xl border border-zinc-100 dark:border-zinc-700/40">
          <iframe
            srcDoc={placeholderEmbed}
            className="absolute inset-0 h-full w-full border-0"
            title="Book a meeting with M. Scott Ford"
            allowFullScreen
          />
        </div>
      </div>
    </Container>
  )
}

const meta: Meta<typeof CalendarPage> = {
  title: 'Pages/Calendar',
  component: CalendarPage,
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

/**
 * The booking widget is configured, so the page frames the embed.
 */
export const Default: Story = {
  args: {
    bookingUrl: 'https://example.com/booking',
  },
}

/**
 * The fallback shown when no booking URL is configured for the build — which
 * is the case for every preview and CI build.
 */
export const Unavailable: Story = {
  args: {
    bookingUrl: undefined,
  },
}

// The same page at the other two viewports. See .storybook/viewports.ts
// for why each width was picked and how Chromatic captures it.
export const Mobile: Story = {
  ...atViewport('mobile'),
  args: { bookingUrl: 'https://example.com/booking' },
}

export const Tablet: Story = {
  ...atViewport('tablet'),
  args: { bookingUrl: 'https://example.com/booking' },
}
