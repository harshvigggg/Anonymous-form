/**
 * Date helpers that respect precision.
 *
 * Dates are stored as partial ISO strings:
 *   "2018"        → year precision
 *   "2021-11"     → month precision
 *   "2024-12-31"  → day precision
 *
 * We never turn "November 2021" into "01-11-2021". When a calculation needs a
 * concrete day, we use the earliest or latest day the value could mean, and the
 * caller decides which one is the safe choice.
 */

export type DatePrecision = 'day' | 'month' | 'year' | 'unknown'

export interface DateParts {
  y: number
  m?: number
  d?: number
}

export const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const DAY_MS = 86_400_000

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate()
}

export function parseDate(value: string | null | undefined): DateParts | null {
  if (!value) return null
  const match = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(value)
  if (!match) return null
  const y = Number(match[1])
  const m = match[2] ? Number(match[2]) : undefined
  const d = match[3] ? Number(match[3]) : undefined
  if (m !== undefined && (m < 1 || m > 12)) return null
  if (d !== undefined && m !== undefined && (d < 1 || d > daysInMonth(y, m))) return null
  return { y, m, d }
}

/** Precision implied by the stored string itself. */
export function precisionOf(value: string | null | undefined): DatePrecision {
  const p = parseDate(value)
  if (!p) return 'unknown'
  if (p.d) return 'day'
  if (p.m) return 'month'
  return 'year'
}

export function toValue(y: number, m?: number | null, d?: number | null): string {
  const yy = String(y).padStart(4, '0')
  if (!m) return yy
  const mm = String(m).padStart(2, '0')
  if (!d) return `${yy}-${mm}`
  return `${yy}-${mm}-${String(d).padStart(2, '0')}`
}

export function dayNumber(y: number, m: number, d: number): number {
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS)
}

export function fromDayNumber(n: number): { y: number; m: number; d: number } {
  const dt = new Date(n * DAY_MS)
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() }
}

export function monthIndex(y: number, m: number): number {
  return y * 12 + (m - 1)
}

export function fromMonthIndex(i: number): { y: number; m: number } {
  return { y: Math.floor(i / 12), m: (i % 12) + 1 }
}

/** Earliest day the value can refer to. */
export function earliestDay(value: string | null | undefined): number | null {
  const p = parseDate(value)
  if (!p) return null
  if (p.m && p.d) return dayNumber(p.y, p.m, p.d)
  if (p.m) return dayNumber(p.y, p.m, 1)
  return dayNumber(p.y, 1, 1)
}

/** Latest day the value can refer to. */
export function latestDay(value: string | null | undefined): number | null {
  const p = parseDate(value)
  if (!p) return null
  if (p.m && p.d) return dayNumber(p.y, p.m, p.d)
  if (p.m) return dayNumber(p.y, p.m, daysInMonth(p.y, p.m))
  return dayNumber(p.y, 12, 31)
}

/** Month index of the value. Year-only values resolve to `yearFallback` (Jan or Dec). */
export function monthOf(value: string | null | undefined, yearFallback: 'first' | 'last'): number | null {
  const p = parseDate(value)
  if (!p) return null
  if (p.m) return monthIndex(p.y, p.m)
  return monthIndex(p.y, yearFallback === 'first' ? 1 : 12)
}

export interface Today {
  day: number
  month: number
  y: number
  m: number
  d: number
}

export function today(now: Date = new Date()): Today {
  const y = now.getFullYear()
  const m = now.getMonth() + 1
  const d = now.getDate()
  return { day: dayNumber(y, m, d), month: monthIndex(y, m), y, m, d }
}

/** True when the value certainly lies after today. */
export function isInFuture(value: string | null | undefined, t: Today = today()): boolean {
  const e = earliestDay(value)
  return e !== null && e > t.day
}

/** True when `end` is certainly before `start`, given their precision. */
export function isCertainlyBefore(end: string | null | undefined, start: string | null | undefined): boolean {
  const endLatest = latestDay(end)
  const startEarliest = earliestDay(start)
  if (endLatest === null || startEarliest === null) return false
  return endLatest < startEarliest
}

export function formatDate(value: string | null | undefined): string {
  const p = parseDate(value)
  if (!p) return '—'
  if (p.m && p.d) return `${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y}`
  if (p.m) return `${MONTHS_SHORT[p.m - 1]} ${p.y}`
  return String(p.y)
}

export function formatRange(
  start: string | null | undefined,
  end: string | null | undefined,
  ongoing: boolean | null | undefined,
  presentLabel = 'Present',
): string {
  const a = formatDate(start)
  const b = ongoing ? presentLabel : formatDate(end)
  if (!ongoing && a === b) return a
  return `${a} – ${b}`
}

/** Whole calendar months covered by a range of month indexes (inclusive). */
export function monthSpan(startMonth: number, endMonth: number): number {
  return Math.max(0, endMonth - startMonth + 1)
}
