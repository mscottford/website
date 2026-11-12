import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Button } from './Button'

// Button accepts a union of button props and Link props. Inferring args from
// that union collapses them to `never`, so spell out the controllable subset
// instead and cast once here.
type ButtonStoryProps = {
  variant?: 'primary' | 'secondary'
  children?: React.ReactNode
  href?: string
  disabled?: boolean
  className?: string
}

const meta: Meta<ButtonStoryProps> = {
  title: 'Components/Button',
  component: Button as React.ComponentType<ButtonStoryProps>,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary'],
      description: 'The visual style of the button',
    },
    children: {
      control: 'text',
      description: 'Button content',
    },
    href: {
      control: 'text',
      description: 'If provided, renders as a link',
    },
  },
}

export default meta
type Story = StoryObj<ButtonStoryProps>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
}

export const AsLink: Story = {
  args: {
    variant: 'primary',
    children: 'Link Button',
    href: '/example',
  },
}

export const SecondaryLink: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Link',
    href: '/example',
  },
}

export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    disabled: true,
  },
}
