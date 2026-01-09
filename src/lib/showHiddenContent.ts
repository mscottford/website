/**
 * Returns true if hidden content should be displayed.
 * Hidden content is only shown in development mode.
 */
export function showHiddenContent(): boolean {
  return process.env.NODE_ENV === 'development'
}
