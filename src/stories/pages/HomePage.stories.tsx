import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Image, { type ImageProps } from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { Container } from '@/components/Container'
import { SocialLink } from '@/components/SocialLink'
import { ArrowDownIcon } from '@/components/icons/ArrowDownIcon'
import { BriefcaseIcon } from '@/components/icons/BriefcaseIcon'
import { GitHubIcon } from '@/components/icons/GitHubIcon'
import { LinkedInIcon } from '@/components/icons/LinkedInIcon'
import { MastodonIcon } from '@/components/icons/MastodonIcon'
import { formatDate } from '@/lib/formatDate'
import logoAirbnb from '@/images/logos/airbnb.svg'
import logoFacebook from '@/images/logos/facebook.svg'
import logoPlanetaria from '@/images/logos/planetaria.svg'
import logoStarbucks from '@/images/logos/starbucks.svg'
import image1 from '@/images/photos/image-1.jpg'
import image2 from '@/images/photos/image-2.jpg'
import image3 from '@/images/photos/image-3.jpg'
import image4 from '@/images/photos/image-4.jpg'
import image5 from '@/images/photos/image-5.jpg'
import { withPageLayout } from '../../../.storybook/decorators/withPageLayout'

interface Article {
  slug: string
  title: string
  description: string
  createdAt: string
}

const sampleArticles: Article[] = [
  {
    slug: 'modern-web-development',
    title: 'Building Modern Web Applications with Next.js',
    description:
      'An exploration of modern web development practices using Next.js, React, and TypeScript. Learn how to build performant, scalable applications.',
    createdAt: '2025-01-10',
  },
  {
    slug: 'typescript-best-practices',
    title: 'TypeScript Best Practices for Large Codebases',
    description:
      'Strategies and patterns for maintaining type safety and developer experience in large TypeScript projects.',
    createdAt: '2024-12-15',
  },
  {
    slug: 'testing-strategies',
    title: 'Effective Testing Strategies for React Applications',
    description:
      'A comprehensive guide to testing React applications, from unit tests to integration tests and visual regression testing.',
    createdAt: '2024-11-20',
  },
  {
    slug: 'reading-legacy-code',
    title: 'Reading Legacy Code Without Losing Your Mind',
    description:
      'Techniques for building a mental model of an unfamiliar codebase before you change a single line of it.',
    createdAt: '2024-10-02',
  },
]

const sampleSocialLinks = [
  {
    platform: 'GitHub',
    url: 'https://github.com/mscottford',
    alt: 'Follow on GitHub',
    icon: GitHubIcon,
  },
  {
    platform: 'LinkedIn',
    url: 'https://www.linkedin.com/in/mscottford/',
    alt: 'Connect on LinkedIn',
    icon: LinkedInIcon,
  },
  {
    platform: 'Mastodon',
    url: 'https://toot.legacycode.rocks/@mscottford',
    alt: 'Follow on Mastodon',
    icon: MastodonIcon,
  },
]

function ArticleCard({ article }: { article: Article }) {
  return (
    <Card as="article">
      <Card.Title href={`/articles/${article.slug}`}>
        {article.title}
      </Card.Title>
      <Card.Eyebrow as="time" dateTime={article.createdAt} decorate>
        {formatDate(article.createdAt)}
      </Card.Eyebrow>
      <Card.Description>{article.description}</Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  )
}

interface Role {
  company: string
  title: string
  logo: ImageProps['src']
  start: string
  end: string
}

// Fixed end date rather than the current year, so the snapshot doesn't change
// when the calendar rolls over.
const resume: Role[] = [
  {
    company: 'Planetaria',
    title: 'CEO',
    logo: logoPlanetaria,
    start: '2019',
    end: 'Present',
  },
  {
    company: 'Airbnb',
    title: 'Product Designer',
    logo: logoAirbnb,
    start: '2014',
    end: '2019',
  },
  {
    company: 'Facebook',
    title: 'iOS Software Engineer',
    logo: logoFacebook,
    start: '2011',
    end: '2014',
  },
  {
    company: 'Starbucks',
    title: 'Shift Supervisor',
    logo: logoStarbucks,
    start: '2008',
    end: '2011',
  },
]

function Resume() {
  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 className="flex text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <BriefcaseIcon className="h-6 w-6 flex-none" />
        <span className="ml-3">Work</span>
      </h2>
      <ol className="mt-6 space-y-4">
        {resume.map((role) => (
          <li key={role.company} className="flex gap-4">
            <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-md ring-1 shadow-zinc-800/5 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
              <Image src={role.logo} alt="" className="h-7 w-7" unoptimized />
            </div>
            <dl className="flex flex-auto flex-wrap gap-x-2">
              <dt className="sr-only">Company</dt>
              <dd className="w-full flex-none text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {role.company}
              </dd>
              <dt className="sr-only">Role</dt>
              <dd className="text-xs text-zinc-500 dark:text-zinc-400">
                {role.title}
              </dd>
              <dt className="sr-only">Date</dt>
              <dd
                className="ml-auto text-xs text-zinc-400 dark:text-zinc-500"
                aria-label={`${role.start} until ${role.end}`}
              >
                <time dateTime={role.start}>{role.start}</time>{' '}
                <span aria-hidden="true">—</span>{' '}
                <time dateTime={role.end}>{role.end}</time>
              </dd>
            </dl>
          </li>
        ))}
      </ol>
      <Button href="#" variant="secondary" className="group mt-6 w-full">
        Download CV
        <ArrowDownIcon className="h-4 w-4 stroke-zinc-400 transition group-active:stroke-zinc-600 dark:group-hover:stroke-zinc-50 dark:group-active:stroke-zinc-50" />
      </Button>
    </div>
  )
}

function Photos() {
  const rotations = [
    'rotate-2',
    '-rotate-2',
    'rotate-2',
    'rotate-2',
    '-rotate-2',
  ]

  return (
    <div className="mt-16 sm:mt-20">
      <div className="-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8">
        {[image1, image2, image3, image4, image5].map((image, imageIndex) => (
          <div
            key={image.src}
            className={clsx(
              'relative w-44 flex-none overflow-hidden rounded-xl bg-zinc-100 sm:w-72 sm:rounded-2xl dark:bg-zinc-800',
              rotations[imageIndex % rotations.length],
            )}
          >
            <div className="aspect-9/10">
              <Image
                src={image}
                alt=""
                sizes="(min-width: 640px) 18rem, 11rem"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The home page: the tagline and teaser, a row of photos, the most recent
 * articles, and optionally the resume panel.
 *
 * The real page pulls its copy and article list from content collections and
 * gates the resume behind `showHiddenContent()`, so the layout is reproduced
 * here with sample data to keep the snapshot stable.
 */
function HomePage({
  articles = sampleArticles,
  showResume = false,
}: {
  articles?: Article[]
  showResume?: boolean
}) {
  return (
    <>
      <Container className="mt-8 sm:mt-16">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 sm:text-5xl dark:text-zinc-100">
            Software mender, legacy code whisperer, speaker, instructor.
          </h1>
          <div className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            <span>
              I&apos;m Scott, a software engineer with a passion for improving
              and maintaining existing codebases. With over a decade of
              experience, I specialize in wrangling legacy systems to enhance
              scalability, stability, and sustainability. When I&apos;m not
              coding, you&apos;ll find me sharing my knowledge in various
              formats, including the{' '}
            </span>
            <Link href="https://legacycode.rocks">Legacy Code Rocks</Link>
            <span> community/podcast, conference talks, and on this site.</span>
          </div>
          <div className="mt-6 flex gap-6">
            {sampleSocialLinks.map((link) => (
              <SocialLink
                key={link.platform}
                href={link.url}
                aria-label={link.alt}
                icon={link.icon}
              />
            ))}
          </div>
        </div>
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div
          className={clsx(
            'grid max-w-xl grid-cols-1 gap-y-20',
            showResume && 'mx-auto lg:max-w-none lg:grid-cols-2',
          )}
        >
          <div className="flex flex-col gap-16">
            {articles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
            <Link
              href="/articles"
              className="flex items-center text-sm font-medium text-teal-500"
            >
              Read more articles
              <svg
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
                className="ml-1 h-4 w-4 stroke-current"
              >
                <path
                  d="M6.75 5.75 9.25 8l-2.5 2.25"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
          {showResume && (
            <div className="space-y-10 lg:pl-8 xl:pl-24">
              <Resume />
            </div>
          )}
        </div>
      </Container>
    </>
  )
}

const meta: Meta<typeof HomePage> = {
  title: 'Pages/Home',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [withPageLayout],
}

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

/**
 * The resume panel is only rendered in development, where it sits in a second
 * column beside the articles.
 */
export const WithResume: Story = {
  args: {
    showResume: true,
  },
}

export const NoArticles: Story = {
  args: {
    articles: [],
  },
}
