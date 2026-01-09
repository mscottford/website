import Link from 'next/link'
import clsx from 'clsx'

import { ContainerInner, ContainerOuter } from '@/components/Container'
import { allNavItems } from 'content-collections'
import { showHiddenContent } from '@/lib/showHiddenContent'

function NavLink({
  href,
  children,
  outlined,
}: {
  href: string
  children: React.ReactNode
  outlined?: boolean
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'transition hover:text-teal-500 dark:hover:text-teal-400',
        outlined && 'outline-1 outline-dashed outline-purple-500 rounded',
      )}
    >
      {children}
    </Link>
  )
}

export function Footer() {
  const visibleNavItems = allNavItems.filter(
    (item) => !item.hidden || showHiddenContent(),
  )

  return (
    <footer className="mt-32 flex-none">
      <ContainerOuter>
        <div className="border-t border-zinc-100 pt-10 pb-16 dark:border-zinc-700/40">
          <ContainerInner>
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {visibleNavItems.map((item) => (
                  <NavLink key={item.href} href={item.href} outlined={item.hidden}>
                    {item.label}
                  </NavLink>
                ))}
              </div>
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                &copy; {new Date().getFullYear()} M. Scott Ford. All rights
                reserved.
              </p>
            </div>
          </ContainerInner>
        </div>
      </ContainerOuter>
    </footer>
  )
}
