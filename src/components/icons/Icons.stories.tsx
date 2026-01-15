import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ArrowDownIcon } from './ArrowDownIcon'
import { BriefcaseIcon } from './BriefcaseIcon'
import { ChevronDownIcon } from './ChevronDownIcon'
import { CloseIcon } from './CloseIcon'
import { GitHubIcon } from './GitHubIcon'
import { InstagramIcon } from './InstagramIcon'
import { LinkedInIcon } from './LinkedInIcon'
import { MastodonIcon } from './MastodonIcon'
import { MoonIcon } from './MoonIcon'
import { SunIcon } from './SunIcon'
import { XIcon } from './XIcon'

const icons = {
  ArrowDownIcon,
  BriefcaseIcon,
  ChevronDownIcon,
  CloseIcon,
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  MastodonIcon,
  MoonIcon,
  SunIcon,
  XIcon,
}

const meta: Meta = {
  title: 'Components/Icons',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const AllIcons: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-8">
      {Object.entries(icons).map(([name, Icon]) => (
        <div key={name} className="flex flex-col items-center gap-2">
          <Icon className="h-6 w-6 fill-zinc-500 dark:fill-zinc-400" />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            {name}
          </span>
        </div>
      ))}
    </div>
  ),
}

export const GitHub: Story = {
  render: () => (
    <GitHubIcon className="h-8 w-8 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
  ),
}

export const LinkedIn: Story = {
  render: () => (
    <LinkedInIcon className="h-8 w-8 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
  ),
}

export const Social: Story = {
  render: () => (
    <div className="flex gap-6">
      <GitHubIcon className="h-6 w-6 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
      <LinkedInIcon className="h-6 w-6 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
      <XIcon className="h-6 w-6 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
      <InstagramIcon className="h-6 w-6 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
      <MastodonIcon className="h-6 w-6 fill-zinc-500 transition hover:fill-zinc-600 dark:fill-zinc-400 dark:hover:fill-zinc-300" />
    </div>
  ),
}

export const ThemeIcons: Story = {
  render: () => (
    <div className="flex gap-6">
      <div className="flex flex-col items-center gap-2">
        <SunIcon className="h-6 w-6 fill-zinc-500 dark:fill-zinc-400" />
        <span className="text-xs text-zinc-600 dark:text-zinc-400">Light</span>
      </div>
      <div className="flex flex-col items-center gap-2">
        <MoonIcon className="h-6 w-6 fill-zinc-500 dark:fill-zinc-400" />
        <span className="text-xs text-zinc-600 dark:text-zinc-400">Dark</span>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-6">
      <GitHubIcon className="h-4 w-4 fill-zinc-500 dark:fill-zinc-400" />
      <GitHubIcon className="h-6 w-6 fill-zinc-500 dark:fill-zinc-400" />
      <GitHubIcon className="h-8 w-8 fill-zinc-500 dark:fill-zinc-400" />
      <GitHubIcon className="h-12 w-12 fill-zinc-500 dark:fill-zinc-400" />
    </div>
  ),
}
