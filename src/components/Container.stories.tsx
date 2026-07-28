import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Container, ContainerInner, ContainerOuter } from './Container'

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

const ExampleContent = () => (
  <div className="bg-teal-100 p-4 dark:bg-teal-900">
    <p className="text-zinc-800 dark:text-zinc-100">
      This is example content inside the container. The container provides
      consistent horizontal padding and max-width constraints across the site.
    </p>
  </div>
)

export const Default: Story = {
  render: () => (
    <Container>
      <ExampleContent />
    </Container>
  ),
}

export const OuterOnly: Story = {
  render: () => (
    <ContainerOuter>
      <div className="bg-teal-100 p-4 dark:bg-teal-900">
        <p className="text-zinc-800 dark:text-zinc-100">
          ContainerOuter provides the outermost padding (sm:px-8) and sets up
          max-width (max-w-7xl) with lg:px-8.
        </p>
      </div>
    </ContainerOuter>
  ),
}

export const InnerOnly: Story = {
  render: () => (
    <ContainerInner>
      <div className="bg-teal-100 p-4 dark:bg-teal-900">
        <p className="text-zinc-800 dark:text-zinc-100">
          ContainerInner provides additional padding and a tighter max-width
          constraint (max-w-2xl lg:max-w-5xl).
        </p>
      </div>
    </ContainerInner>
  ),
}

export const WithCustomClass: Story = {
  render: () => (
    <Container className="bg-zinc-100 py-8 dark:bg-zinc-800">
      <ExampleContent />
    </Container>
  ),
}
