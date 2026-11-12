import { expect, userEvent, waitFor, within } from 'storybook/test'

/**
 * Clicks the theme toggle in the header and checks the page switches to dark.
 *
 * The toggle is part of the shared header, so it appears on every page. The
 * component is the same one each time, but running this per page also checks
 * that the page underneath actually responds to the change rather than only
 * the button.
 *
 * Chromatic captures the story after the play function finishes, so these
 * snapshots show the toggled-to-dark page, and a broken toggle fails the build
 * rather than quietly snapshotting a light page.
 */
export async function togglesToDarkTheme({
  canvasElement,
}: {
  canvasElement: HTMLElement
}) {
  const canvas = within(canvasElement)
  const html = document.documentElement

  // next-themes applies the class in an effect, and the toggle only knows which
  // theme to offer once it has mounted, so wait for the label to settle rather
  // than reading it straight away.
  const toggle = await canvas.findByRole('button', {
    name: /switch to dark theme/i,
  })
  await expect(html).not.toHaveClass('dark')

  await userEvent.click(toggle)

  await waitFor(() => expect(html).toHaveClass('dark'))
  await expect(
    await canvas.findByRole('button', { name: /switch to light theme/i }),
  ).toBeInTheDocument()
}
