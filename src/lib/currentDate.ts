/**
 * The current date, behind a seam.
 *
 * A few places render the current year: the footer's copyright line, the
 * "Present" end date on the resume, and the feed's copyright field. Calling
 * `new Date()` directly in those places means the output can't be pinned,
 * which makes Storybook's visual snapshots change on New Year's Day and
 * report a diff nobody asked for.
 *
 * Everything that needs today's date goes through here instead, so a story or
 * a test can substitute a fixed one.
 */
type DateSource = () => Date

const systemDate: DateSource = () => new Date()

let dateSource: DateSource = systemDate

/**
 * Pin the date that the rest of the site reads.
 *
 * Intended for stories and tests. Application code should leave this alone and
 * let the system clock through.
 */
export function setCurrentDate(date: Date | DateSource): void {
  dateSource = typeof date === 'function' ? date : () => date
}

/** Undo `setCurrentDate` and go back to the system clock. */
export function resetCurrentDate(): void {
  dateSource = systemDate
}

export function getCurrentDate(): Date {
  return dateSource()
}

export function getCurrentYear(): number {
  return getCurrentDate().getFullYear()
}
