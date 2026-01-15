import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SimpleLayout } from './SimpleLayout'

const meta: Meta<typeof SimpleLayout> = {
  title: 'Layout/SimpleLayout',
  component: SimpleLayout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Page title',
    },
    intro: {
      control: 'text',
      description: 'Introductory paragraph',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Page Title',
    intro:
      'This is the introductory text that appears below the title. It provides context and sets expectations for the page content.',
  },
}

export const WithChildren: Story = {
  args: {
    title: 'Projects',
    intro:
      'A collection of projects I have worked on over the years, ranging from open source contributions to personal experiments.',
    children: (
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            Project One
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            A brief description of the first project.
          </p>
        </div>
        <div className="rounded-lg bg-zinc-50 p-6 dark:bg-zinc-800/50">
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-100">
            Project Two
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            A brief description of the second project.
          </p>
        </div>
      </div>
    ),
  },
}

export const ArticlesPage: Story = {
  args: {
    title: 'Writing on software development',
    intro:
      'All of my long-form thoughts on programming, leadership, product design, and more, collected in chronological order.',
    children: (
      <div className="space-y-8">
        <article>
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            Building Modern Web Applications
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            An exploration of modern web development practices and tools.
          </p>
        </article>
        <article>
          <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            The Future of TypeScript
          </h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Thoughts on where TypeScript is headed and what it means for
            developers.
          </p>
        </article>
      </div>
    ),
  },
}
