import { PopoverButton } from '@headlessui/react'
import Link from 'next/link'
import clsx from 'clsx'

export function MobileNavItem({
  href,
  children,
  outlined,
}: {
  href: string
  children: React.ReactNode
  outlined?: boolean
}) {
  return (
    <li>
      <PopoverButton
        as={Link}
        href={href}
        className={clsx(
          'block py-2',
          outlined && 'outline-1 outline-dashed outline-purple-500 rounded',
        )}
      >
        {children}
      </PopoverButton>
    </li>
  )
}
