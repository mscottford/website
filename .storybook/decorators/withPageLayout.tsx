import { ThemeProvider } from 'next-themes'
import { Layout } from '@/components/Layout'
import { AppContext } from '@/app/providers'

/**
 * Decorator that wraps stories with the full page layout including
 * header, footer, and theme provider.
 */
export function withPageLayout(Story: React.ComponentType) {
  return (
    <AppContext.Provider value={{ previousPathname: undefined }}>
      <ThemeProvider attribute="class" disableTransitionOnChange>
        <Layout>
          <Story />
        </Layout>
      </ThemeProvider>
    </AppContext.Provider>
  )
}
