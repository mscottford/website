import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Container } from '@/components/Container'
import { Prose } from '@/components/Prose'
import { formatDate } from '@/lib/formatDate'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'
import { atViewport, defaultPageViewport } from '../../../.storybook/viewports'
import { togglesToDarkTheme } from '../../../.storybook/interactions'

/**
 * A single article, combining the `[slug]` layout shell with the article
 * header and prose body.
 *
 * The real page reads the post from content collections and imports its MDX
 * body dynamically, so representative content is inlined here instead. This is
 * the only story that exercises `Prose`, so it is what catches typography
 * regressions across headings, lists, code, and blockquotes.
 */
function ArticlePage({
  title = 'Reading Legacy Code Without Losing Your Mind',
  createdAt = '2025-01-10',
  children,
}: {
  title?: string
  createdAt?: string
  children?: React.ReactNode
}) {
  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          <article>
            <header className="flex flex-col">
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
                {title}
              </h1>
              <time
                dateTime={createdAt}
                className="order-first flex items-center text-base text-zinc-500 dark:text-zinc-400"
              >
                <span className="h-4 w-0.5 rounded-full bg-zinc-200 dark:bg-zinc-500" />
                <span className="ml-3">{formatDate(createdAt)}</span>
              </time>
            </header>
            <Prose className="mt-8" data-mdx-content>
              {children}
            </Prose>
          </article>
        </div>
      </div>
    </Container>
  )
}

function SampleContent() {
  return (
    <>
      <p>
        The hardest part of working with an unfamiliar codebase isn&apos;t
        changing it. It&apos;s building enough of a mental model that you can
        predict what your change will do before you make it.
      </p>
      <h2>Start at the edges</h2>
      <p>
        Every system has a boundary where it talks to the outside world: HTTP
        handlers, message consumers, cron entrypoints. Those are the places
        where behaviour is easiest to describe, because you can state what goes
        in and what comes out without understanding anything in between.
      </p>
      <ul>
        <li>Find the entrypoints and list them.</li>
        <li>Pick the one closest to the change you need to make.</li>
        <li>Trace it inward until you hit something you don&apos;t follow.</li>
      </ul>
      <p>
        That last step is the useful one. The point where you get lost is the
        point worth writing a characterization test around.
      </p>
      <h2>Write the test you wish existed</h2>
      <p>
        A characterization test doesn&apos;t assert what the code{' '}
        <em>should</em> do. It asserts what it <strong>currently</strong> does,
        which is a very different and much more achievable goal:
      </p>
      {/* Matches what the site's MDX now renders; see mdx-components.tsx. */}
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre tabIndex={0}>
        <code>{`test('returns the legacy shape', () => {
  expect(render(order)).toEqual(snapshotOfTodaysBehaviour)
})`}</code>
      </pre>
      <p>
        Now you have a safety net. It is a net woven out of bugs as well as
        features, but it will tell you the moment your refactoring changes
        something you didn&apos;t intend to change.
      </p>
      <blockquote>
        <p>
          You cannot refactor code you cannot observe. Observation comes first.
        </p>
      </blockquote>
      <p>
        Once the behaviour is pinned down, the rest is ordinary work: rename
        things, extract the pieces you understand, and let the test tell you
        when you&apos;ve gone too far.
      </p>
    </>
  )
}

const meta: Meta<typeof ArticlePage> = {
  title: 'Pages/Article',
  component: ArticlePage,
  parameters: {
    layout: 'fullscreen',
    ...defaultPageViewport.parameters,
  },
  globals: defaultPageViewport.globals,
  tags: ['autodocs'],
  decorators: [withPageLayout],
  args: {
    children: <SampleContent />,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

// Every content variant is captured at all three viewports. Each variant's
// mobile and tablet stories are composed from the variant itself, so the two
// can't drift apart. See .storybook/viewports.ts for why each width was picked
// and how Chromatic captures it.
export const Mobile: Story = atViewport('mobile')

export const Tablet: Story = atViewport('tablet')

// Dark mode is applied by a decorator that adds the `dark` class to a wrapper,
// so it lives in the rendered DOM and Chromatic captures it from the story
// globals alone. See the note in .storybook/viewports.ts.
export const Dark: Story = atViewport('desktop', { theme: 'dark' })

export const DarkMobile: Story = atViewport('mobile', { theme: 'dark' })

export const DarkTablet: Story = atViewport('tablet', { theme: 'dark' })

// Clicks the header toggle and checks the page switches to dark.
export const ThemeToggle: Story = {
  play: togglesToDarkTheme,
}

/**
 * Long titles wrap to multiple lines and push the body down; worth pinning so
 * the header spacing doesn't regress. Narrow viewports wrap it hardest, so the
 * mobile story is the one that matters most here.
 */
export const LongTitle: Story = {
  args: {
    title:
      'What Twenty Years of Maintaining Other People’s Code Taught Me About Writing My Own',
  },
}

export const LongTitleMobile: Story = {
  ...LongTitle,
  ...atViewport('mobile'),
}

export const LongTitleTablet: Story = {
  ...LongTitle,
  ...atViewport('tablet'),
}

export const LongTitleDark: Story = {
  ...LongTitle,
  ...atViewport('desktop', { theme: 'dark' }),
}

export const LongTitleDarkMobile: Story = {
  ...LongTitle,
  ...atViewport('mobile', { theme: 'dark' }),
}

export const LongTitleDarkTablet: Story = {
  ...LongTitle,
  ...atViewport('tablet', { theme: 'dark' }),
}
