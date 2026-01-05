import { GitHubIcon } from '@/components/icons/GitHubIcon'
import { LinkedInIcon } from '@/components/icons/LinkedInIcon'
import { MastodonIcon } from '@/components/icons/MastodonIcon'

export const iconsByName: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  mastodon: MastodonIcon,
}
