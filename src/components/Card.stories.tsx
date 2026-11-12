import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Title>Card Title</Card.Title>
      <Card.Description>
        This is a description of the card content. It provides additional
        context about what the card represents.
      </Card.Description>
    </Card>
  ),
}

export const WithLink: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Title href="/articles/example">Linked Card Title</Card.Title>
      <Card.Description>
        Click on the title to navigate. The entire card has a hover effect.
      </Card.Description>
    </Card>
  ),
}

export const WithEyebrow: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Eyebrow>January 15, 2025</Card.Eyebrow>
      <Card.Title href="/articles/example">Article with Date</Card.Title>
      <Card.Description>
        This card includes an eyebrow component for metadata like dates or
        categories.
      </Card.Description>
    </Card>
  ),
}

export const WithDecoratedEyebrow: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Eyebrow decorate>January 15, 2025</Card.Eyebrow>
      <Card.Title href="/articles/example">
        Article with Decorated Date
      </Card.Title>
      <Card.Description>
        The eyebrow has a decorative indicator on the left side.
      </Card.Description>
    </Card>
  ),
}

export const WithCta: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Title href="/articles/example">Card with Call to Action</Card.Title>
      <Card.Description>
        This card includes a call-to-action element at the bottom.
      </Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  ),
}

export const FullFeatured: Story = {
  render: () => (
    <Card className="max-w-md">
      <Card.Eyebrow decorate>January 15, 2025</Card.Eyebrow>
      <Card.Title href="/articles/example">Full Featured Card</Card.Title>
      <Card.Description>
        This card demonstrates all available subcomponents working together:
        eyebrow with decoration, linked title, description, and call-to-action.
      </Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  ),
}

export const AsArticle: Story = {
  render: () => (
    <Card as="article" className="max-w-md">
      <Card.Eyebrow as="time" dateTime="2025-01-15" decorate>
        January 15, 2025
      </Card.Eyebrow>
      <Card.Title href="/articles/example">Semantic Article Card</Card.Title>
      <Card.Description>
        This card renders as an article element with proper semantic HTML.
      </Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  ),
}
