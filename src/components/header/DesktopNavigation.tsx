import { NavItem } from '@/components/header/NavItem'
import { allNavItems } from 'content-collections'
import { showHiddenContent } from '@/lib/showHiddenContent'

export function DesktopNavigation(
  props: React.ComponentPropsWithoutRef<'nav'>,
) {
  const visibleNavItems = allNavItems.filter(
    (item) => !item.hidden || showHiddenContent(),
  )

  return (
    <nav {...props}>
      <ul className="flex rounded-full bg-white/90 px-3 text-sm font-medium text-zinc-800 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm dark:bg-zinc-800/90 dark:text-zinc-200 dark:ring-white/10">
        {visibleNavItems.map((item) => (
          <NavItem key={item.href} href={item.href} outlined={item.hidden}>
            {item.label}
          </NavItem>
        ))}
      </ul>
    </nav>
  )
}