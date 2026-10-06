import { monthOf, today as getToday, type Today } from '@/domain/dates'
import { timelineRules } from '@/config/validationRules'
import type { TimelineEntry, TimelineOverlap } from './types'

/**
 * Overlaps use the *tightest* reading of each date (year-only start → December,
 * year-only end → January), so we only ask the candidate about overlaps that
 * certainly happened. Sharing a single boundary month is normal and ignored.
 */
function tightMonths(entry: TimelineEntry, t: Today): { start: number; end: number } | null {
  if (entry.status === 'draft') return null
  const start = monthOf(entry.startDate, 'last')
  const end = entry.ongoing ? t.month : monthOf(entry.endDate, 'first')
  if (start === null || end === null || end < start) return null
  return { start, end }
}

export function overlapId(a: string, b: string): string {
  return [a, b].sort().join('__')
}

export function overlapSignature(a: TimelineEntry, b: TimelineEntry): string {
  const [x, y] = [a, b].sort((p, q) => p.id.localeCompare(q.id))
  const sig = (e: TimelineEntry) => `${e.startDate}|${e.ongoing ? 'ongoing' : e.endDate}`
  return `${sig(x)}#${sig(y)}`
}

export function detectOverlaps(
  entries: TimelineEntry[],
  confirmed: Record<string, string> = {},
  t: Today = getToday(),
): TimelineOverlap[] {
  const result: TimelineOverlap[] = []
  const ranges = entries
    .map((e) => ({ e, r: tightMonths(e, t) }))
    .filter((x): x is { e: TimelineEntry; r: { start: number; end: number } } => x.r !== null)

  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i]
      const b = ranges[j]
      const months = Math.min(a.r.end, b.r.end) - Math.max(a.r.start, b.r.start) + 1
      if (months < timelineRules.minOverlapMonths) continue
      const id = overlapId(a.e.id, b.e.id)
      const signature = overlapSignature(a.e, b.e)
      result.push({
        id,
        entryIdA: a.e.id,
        entryIdB: b.e.id,
        signature,
        months,
        confirmed: confirmed[id] === signature,
      })
    }
  }
  return result
}
