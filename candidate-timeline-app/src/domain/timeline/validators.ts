import { today as getToday, type Today } from '@/domain/dates'
import { entryErrors, entryWarnings } from '@/domain/entries/schemas'
import { displayOrg } from '@/lib/normalization/orgName'
import { searchKey } from '@/lib/normalization/text'
import { detectTimelineGaps } from './gapDetector'
import { detectOverlaps } from './overlapDetector'
import { applyOverrides } from './review'
import type {
  CandidateProfile,
  ExecutiveReview,
  TimelineEntry,
  TimelineGap,
  TimelineOverlap,
  ValidationCode,
  ValidationIssue,
} from './types'

export interface ProfileValidation {
  /** Entries with executive corrections applied */
  entries: TimelineEntry[]
  issues: ValidationIssue[]
  /** Open blocking errors */
  errors: ValidationIssue[]
  /** Open warnings (go to executive review) */
  warnings: ValidationIssue[]
  accepted: ValidationIssue[]
  gaps: TimelineGap[]
  openGaps: TimelineGap[]
  overlaps: TimelineOverlap[]
  canSubmit: boolean
}

/** Executives may accept these errors explicitly. Everything else must be fixed. */
export const ACCEPTABLE_ERRORS: ValidationCode[] = ['UNRESOLVED_TIMELINE_GAP', 'TIMELINE_OVERLAP']

export function issueId(code: string, scope: string, field = ''): string {
  return `${code}:${scope}:${field}`
}

function identity(e: TimelineEntry): string {
  switch (e.type) {
    case 'training':
      return `${e.qualificationId}|${searchKey(displayOrg(e.institution))}`
    case 'school':
      return `${e.schoolQualificationId}|${searchKey(displayOrg(e.institution))}`
    case 'professional_experience':
      return `${e.jobTitleId}|${searchKey(displayOrg(e.facility))}`
    case 'career_break':
      return `${e.breakTypeId}`
    case 'volunteering':
      return searchKey(e.purpose)
  }
}

export function validateProfile(
  profile: CandidateProfile,
  review: ExecutiveReview,
  opts: { candidateId?: string; today?: Today } = {},
): ProfileValidation {
  const t = opts.today ?? getToday()
  const candidateId = opts.candidateId ?? ''
  const entries = applyOverrides(profile.entries, review)
  const issues: ValidationIssue[] = []

  const push = (i: Omit<ValidationIssue, 'id' | 'candidateId' | 'status' | 'createdAt'> & { scope: string }) => {
    const { scope, ...rest } = i
    const id = issueId(i.code, scope, i.field)
    const decision = review.issueDecisions[id]
    const acceptable = i.severity !== 'error' || ACCEPTABLE_ERRORS.includes(i.code)
    issues.push({
      ...rest,
      id,
      candidateId,
      status: decision && acceptable ? 'accepted_by_admin' : 'open',
      createdAt: profile.updatedAt,
      resolvedAt: decision && acceptable ? decision.at : undefined,
    })
  }

  // 1. Per-entry rules
  for (const e of entries) {
    if (e.status === 'draft') {
      push({ scope: e.id, timelineEntryId: e.id, code: 'ENTRY_UNFINISHED', severity: 'error', message: 'err.unfinished' })
      continue
    }
    for (const fi of [...entryErrors(e), ...entryWarnings(e)]) {
      push({ scope: e.id, timelineEntryId: e.id, field: fi.field, code: fi.code, severity: fi.severity, message: fi.message, params: fi.params })
    }
  }

  // 2. Required sections
  if (!entries.some((e) => e.type === 'school')) {
    push({ scope: 'profile', field: 'school', code: 'REQUIRED_SECTION_MISSING', severity: 'error', message: 'err.schoolMissing' })
  }
  if (!entries.some((e) => e.type === 'training')) {
    push({ scope: 'profile', field: 'training', code: 'REQUIRED_SECTION_MISSING', severity: 'error', message: 'err.trainingMissing' })
  }

  // 3. Duplicates
  const seen = new Map<string, string>()
  for (const e of [...entries].filter((x) => x.status !== 'draft').sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const key = `${e.type}|${identity(e)}|${e.startDate}|${e.ongoing ? 'ongoing' : e.endDate}`
    if (seen.has(key)) {
      push({ scope: e.id, timelineEntryId: e.id, code: 'DUPLICATE_ENTRY', severity: 'error', message: 'err.duplicate' })
    } else seen.set(key, e.id)
  }

  // 4. Gaps
  const gaps = detectTimelineGaps(entries, { candidateId, today: t }).map((g) => {
    const decided = review.issueDecisions[issueId('UNRESOLVED_TIMELINE_GAP', g.key)]
    return { ...g, status: decided ? ('ignored_by_admin' as const) : g.status }
  })
  for (const g of gaps) {
    push({ scope: g.key, gapKey: g.key, code: 'UNRESOLVED_TIMELINE_GAP', severity: 'error', message: 'err.gap', params: { months: g.durationMonthsApprox } })
  }

  // 5. Overlaps
  const overlaps = detectOverlaps(entries, profile.confirmedOverlaps, t)
  for (const o of overlaps) {
    if (o.confirmed) {
      push({ scope: o.id, overlapId: o.id, code: 'TIMELINE_OVERLAP_CONFIRMED', severity: 'warning', message: 'warn.TIMELINE_OVERLAP_CONFIRMED', params: { months: o.months } })
    } else {
      push({ scope: o.id, overlapId: o.id, code: 'TIMELINE_OVERLAP', severity: 'error', message: 'err.overlap', params: { months: o.months } })
    }
  }

  const open = issues.filter((i) => i.status === 'open')
  const errors = open.filter((i) => i.severity === 'error')
  return {
    entries,
    issues,
    errors,
    warnings: open.filter((i) => i.severity === 'warning'),
    accepted: issues.filter((i) => i.status === 'accepted_by_admin'),
    gaps,
    openGaps: gaps.filter((g) => g.status === 'unresolved'),
    overlaps,
    canSubmit: errors.length === 0,
  }
}

/** §71 – the candidate can submit only when no blocking error is open. */
export function canCandidateSubmit(v: ProfileValidation): boolean {
  return v.errors.length === 0
}
