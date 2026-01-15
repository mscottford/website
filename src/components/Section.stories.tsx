import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Section } from './Section'

const meta: Meta<typeof Section> = {
  title: 'Layout/Section',
  component: Section,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Section heading',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    title: 'Section Title',
    children: (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        This is the content area of the section. It takes up 3/4 of the width on
        medium screens and above, with the title in the remaining 1/4.
      </p>
    ),
  },
}

export const WithMultipleItems: Story = {
  args: {
    title: 'Work Experience',
    children: (
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Software Engineer at Company A
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            2020 - Present
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
            Junior Developer at Company B
          </h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">2018 - 2020</p>
        </div>
      </div>
    ),
  },
}

export const Skills: Story = {
  args: {
    title: 'Skills',
    children: (
      <div className="flex flex-wrap gap-2">
        {['TypeScript', 'React', 'Next.js', 'Node.js', 'Tailwind CSS'].map(
          (skill) => (
            <span
              key={skill}
              className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {skill}
            </span>
          ),
        )}
      </div>
    ),
  },
}
