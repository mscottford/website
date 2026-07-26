import { ThemeProvider } from 'next-themes'
import { Layout } from '@/components/Layout'
import { AppContext } from '@/app/providers'

/**
 * Decorator that wraps stories with the full page layout including
 * header, footer, and theme provider.
 *
 * The site follows the operating system's colour scheme, but a story cannot:
 * whatever `prefers-color-scheme` the machine taking the snapshot happens to
 * report would decide what every page looks like. So the provider is pinned to
 * light here and the dark stories ask for dark explicitly. The theme toggle
 * still works — it sets the class on the document, same as in the browser —
 * which is what the toggle interaction stories exercise.
 */
export function withPageLayout(Story: React.ComponentType) {
  return (
    <AppContext.Provider value={{ previousPathname: undefined }}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        <Layout>
          <Story />
        </Layout>
      </ThemeProvider>
    </AppContext.Provider>
  )
}
