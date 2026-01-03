import Link from 'next/link'
import clsx from 'clsx'
import Image from 'next/image'
import avatarImage from '@/images/avatar.jpg'

export function Avatar({
  label = undefined,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<typeof Link>, 'href'> & {
  label?: string
}) {
  return (
    <Link
      href="/"
      aria-label="Home"
      className={clsx(className, 'pointer-events-auto')}
      {...props}
    >
      <Image
        src={avatarImage}
        alt=""
        sizes="2.25rem"
        className="inline h-9 w-9 rounded-full bg-zinc-100 object-cover dark:bg-zinc-800"
        priority
      />
      {label && (
        <span className="mr-2.5 bg-white/90 px-3 py-2 text-sm font-medium text-zinc-800 hover:text-teal-500 dark:bg-zinc-800/90 dark:text-zinc-200 dark:hover:text-teal-400">
          M. Scott Ford
        </span>
      )}
    </Link>
  )
}