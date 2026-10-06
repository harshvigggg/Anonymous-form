import { entryEditPath, entryTitle, newEntryPath } from '@/domain/entries/entries'
import type { TimelineEntry, ValidationIssue } from '@/domain/timeline/types'
import type { Translate } from '@/i18n'
import { fixStep } from './wizards'

/** Opens the career-break form for a gap – or resumes the unfinished one already started for it. */
export function gapHref(token: string, gapKey: string, entries: TimelineEntry[]): string {
  const draft = entries.find((e) => e.type === 'career_break' && e.status === 'draft' && e.sourceGapKey === gapKey)
  return draft ? entryEditPath(token, draft) : `/candidate/${token}/experience/career-break/new?gap=${encodeURIComponent(gapKey)}`
}

/** Where the candidate goes to fix an issue – always the exact screen. */
export function fixHref(issue: ValidationIssue, token: string, entries: TimelineEntry[]): string {
  if (issue.gapKey) return gapHref(token, issue.gapKey, entries)
  if (issue.overlapId) return `/candidate/${token}#overlap-${issue.overlapId}`
  if (issue.code === 'REQUIRED_SECTION_MISSING') return newEntryPath(token, issue.field === 'school' ? 'school' : 'training')
  const entry = entries.find((e) => e.id === issue.timelineEntryId)
  if (!entry) return `/candidate/${token}`
  const generic = issue.code === 'ENTRY_UNFINISHED' || issue.code === 'DUPLICATE_ENTRY'
  return entryEditPath(token, entry, generic ? undefined : fixStep(entry.type, issue.field))
}

export function issueText(issue: ValidationIssue, t: Translate, entries: TimelineEntry[]): { title: string | null; message: string } {
  const entry = entries.find((e) => e.id === issue.timelineEntryId)
  return {
    title: entry ? entryTitle(entry) : null,
    message: t(issue.message, { ...issue.params, field: issue.field ? t(`field.${issue.field}`) : '' }),
  }
}
