'use client'

import { createContext, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider, useTheme } from 'next-themes'

// Tracks the last value that differs from the current one. Stored in state and
// updated during render (React's documented pattern) rather than read from a
// ref during render, which React forbids because it can render stale values.
function usePrevious<T>(value: T) {
  const [current, setCurrent] = useState(value)
  const [previous, setPrevious] = useState<T | undefined>(undefined)

  if (value !== current) {
    setPrevious(current)
    setCurrent(value)
  }

  return previous
}

function ThemeWatcher() {
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    function onMediaChange() {
      const systemTheme = media.matches ? 'dark' : 'light'
      if (resolvedTheme === systemTheme) {
        setTheme('system')
      }
    }

    onMediaChange()
    media.addEventListener('change', onMediaChange)

    return () => {
      media.removeEventListener('change', onMediaChange)
    }
  }, [resolvedTheme, setTheme])

  return null
}

export const AppContext = createContext<{ previousPathname?: string }>({})

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const previousPathname = usePrevious(pathname)

  return (
    <AppContext.Provider value={{ previousPathname }}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <ThemeWatcher />
        {children}
      </ThemeProvider>
    </AppContext.Provider>
  )
}
