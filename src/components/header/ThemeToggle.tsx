'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { MoonIcon, SunIcon } from '@/components/icons'

export function ThemeToggle() {
  const { resolvedTheme, systemTheme, setTheme } = useTheme()
  const otherTheme = resolvedTheme === 'dark' ? 'light' : 'dark'
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // The teal accent means "what you're looking at isn't what your OS asked
  // for". It used to be spelled as a `prefers-color-scheme` media query, which
  // asked the operating system directly instead of asking the theme we are
  // actually rendering. That was wrong in any context where the provider isn't
  // following the OS — with system detection off the icon still coloured itself
  // as though the OS had a say — and it made the accent impossible to render
  // deterministically, since it depended on the machine doing the rendering.
  // Comparing the two values next-themes already hands us says the same thing
  // and stays true to the theme on screen.
  const overridesSystemPreference =
    mounted && systemTheme !== undefined && resolvedTheme !== systemTheme

  return (
    <button
      type="button"
      aria-label={mounted ? `Switch to ${otherTheme} theme` : 'Toggle theme'}
      className="group rounded-full bg-white/90 px-3 py-2 shadow-lg ring-1 shadow-zinc-800/5 ring-zinc-900/5 backdrop-blur-sm transition dark:bg-zinc-800/90 dark:ring-white/10 dark:hover:ring-white/20"
      onClick={() => setTheme(otherTheme)}
    >
      <SunIcon
        className={clsx(
          'h-6 w-6 transition dark:hidden',
          overridesSystemPreference
            ? 'fill-teal-50 stroke-teal-500 group-hover:fill-teal-50 group-hover:stroke-teal-600'
            : 'fill-zinc-100 stroke-zinc-500 group-hover:fill-zinc-200 group-hover:stroke-zinc-700',
        )}
      />
      <MoonIcon
        className={clsx(
          'hidden h-6 w-6 transition dark:block',
          overridesSystemPreference
            ? 'fill-teal-400/10 stroke-teal-500'
            : 'fill-zinc-700 stroke-zinc-500 group-hover:stroke-zinc-400',
        )}
      />
    </button>
  )
}
