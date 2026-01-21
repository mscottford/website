import { type Metadata } from 'next'

import { Container } from '@/components/Container'

export const metadata: Metadata = {
  title: 'Book a Meeting',
  description: 'Schedule a time to meet with M. Scott Ford.',
  robots: {
    index: false,
    follow: false,
  },
}

export default function Calendar() {
  const bookingUrl = process.env.NEXT_PUBLIC_CALENDAR_BOOKING_URL

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
            src={bookingUrl}
            className="absolute inset-0 h-full w-full border-0"
            title="Book a meeting with M. Scott Ford"
            allowFullScreen
          />
        </div>
      </div>
    </Container>
  )
}
