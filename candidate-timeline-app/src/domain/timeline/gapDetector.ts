import {
  earliestDay,
  fromDayNumber,
  latestDay,
  monthIndex,
  precisionOf,
  toValue,
  today as getToday,
  type DatePrecision,
  type Today,
} from '@/domain/dates'
import { timelineRules } from '@/config/validationRules'
import type { TimelineEntry, TimelineGap } from './types'

/**
 * Coverage interval of one entry, in day numbers.
 *
 * We read every date in the most generous way (month → whole month,
 * year → whole year) so that month-level dates never produce fake
 * day-level gaps. "Dec 2024 → Jan 2025" therefore has no gap.
 */
export interface CoverageInterval {
  entryId: string
  start: number
  end: number
  /** True when the end boundary came from a day-precision date. */
  endIsDay: boolean
  startIsDay: boolean
  ongoing: boolean
}

export function toCoverageInterval(entry: TimelineEntry, t: Today): CoverageInterval | null {
  if (entry.status === 'draft') return null
  const start = earliestDay(entry.startDate)
  if (start === null) return null
  const end = entry.ongoing ? t.day : latestDay(entry.endDate)
  if (end === null || end < start) return null
  return {
    entryId: entry.id,
    start,
    end,
    startIsDay: precisionOf(entry.startDate) === 'day',
    endIsDay: !entry.ongoing && precisionOf(entry.endDate) === 'day',
    ongoing: !!entry.ongoing,
  }
}

export function sortByStartDate(intervals: CoverageInterval[]): CoverageInterval[] {
  return [...intervals].sort((a, b) => a.start - b.start || a.end - b.end)
}

function boundaryValue(day: number, isDay: boolean): { value: string; precision: DatePrecision } {
  const { y, m, d } = fromDayNumber(day)
  return isDay ? { value: toValue(y, m, d), precision: 'day' } : { value: toValue(y, m), precision: 'month' }
}

function monthsBetween(startDay: number, endDay: number): number {
  const a = fromDayNumber(startDay)
  const b = fromDayNumber(endDay)
  return monthIndex(b.y, b.m) - monthIndex(a.y, a.m) + 1
}

/**
 * An uncovered span counts as a gap when:
 *  - a day-precision boundary is involved and it is longer than ~30 days, or
 *  - both boundaries are month/year level and at least one whole month is uncovered.
 */
function isRealGap(startDay: number, endDay: number, dayLevel: boolean): boolean {
  const days = endDay - startDay + 1
  if (days <= 0) return false
  if (dayLevel) return days > timelineRules.minGapDays
  return monthsBetween(startDay, endDay) >= 1 && days >= 28
}

export function gapKey(startDate: string, endDate: string, endIsPresent: boolean): string {
  return `${startDate}_${endIsPresent ? 'present' : endDate}`
}

export interface DetectOptions {
  candidateId?: string
  today?: Today
}

export function detectTimelineGaps(entries: TimelineEntry[], opts: DetectOptions = {}): TimelineGap[] {
  const t = opts.today ?? getToday()
  const sorted = sortByStartDate(
    entries.map((e) => toCoverageInterval(e, t)).filter((x): x is CoverageInterval => x !== null),
  )
  if (sorted.length === 0) return []

  const gaps: TimelineGap[] = []
  let coverEnd = sorted[0].end
  let coverEndIsDay = sorted[0].endIsDay
  let coverEndEntry = sorted[0].entryId

  const pushGap = (
    startDay: number,
    endDay: number,
    startIsDay: boolean,
    endIsDay: boolean,
    prevId: string | null,
    nextId: string | null,
    endIsPresent: boolean,
  ) => {
    const s = boundaryValue(startDay, startIsDay)
    const e = endIsPresent
      ? { value: toValue(t.y, t.m), precision: 'month' as DatePrecision }
      : boundaryValue(endDay, endIsDay)
    const key = gapKey(s.value, e.value, endIsPresent)
    gaps.push({
      id: `gap:${key}`,
      key,
      candidateId: opts.candidateId ?? '',
      startDate: s.value,
      startDatePrecision: s.precision,
      endDate: e.value,
      endDatePrecision: e.precision,
      endIsPresent,
      durationDaysApprox: endDay - startDay + 1,
      durationMonthsApprox: Math.max(1, monthsBetween(startDay, endDay)),
      previousEntryId: prevId,
      nextEntryId: nextId,
      status: 'unresolved',
    })
  }

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i]
    const gapStart = coverEnd + 1
    const gapEnd = next.start - 1
    if (gapEnd >= gapStart) {
      const dayLevel = coverEndIsDay || next.startIsDay
      if (isRealGap(gapStart, gapEnd, dayLevel)) {
        pushGap(gapStart, gapEnd, coverEndIsDay, next.startIsDay, coverEndEntry, next.entryId, false)
      }
    }
    if (next.end > coverEnd) {
      coverEnd = next.end
      coverEndIsDay = next.endIsDay
      coverEndEntry = next.entryId
    }
  }

  // Period from the last activity up to today.
  const hasOngoing = sorted.some((s) => s.ongoing)
  if (!hasOngoing && coverEnd < t.day) {
    const gapStart = coverEnd + 1
    const days = t.day - gapStart + 1
    const months = monthsBetween(gapStart, t.day)
    const isGap = coverEndIsDay ? days > timelineRules.minGapDays : months >= 2 || days > timelineRules.minGapDays
    if (isGap) pushGap(gapStart, t.day, coverEndIsDay, false, coverEndEntry, null, true)
  }

  return gaps
}
