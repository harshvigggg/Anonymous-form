import { earliestDay, precisionOf, today as getToday, type Today } from '@/domain/dates'
import { qualityWeights } from '@/config/validationRules'
import { isEducation, WORK_TYPES } from '@/domain/entries/entries'
import type { ProfileValidation } from './validators'

export interface QualityBreakdown {
  total: number
  parts: { key: keyof typeof qualityWeights; score: number; max: number }[]
}

/** Executive-facing 0–100 profile quality score (§73). */
export function profileQuality(v: ProfileValidation, t: Today = getToday()): QualityBreakdown {
  const entries = v.entries.filter((e) => e.status !== 'draft')
  const ratio = (num: number, den: number, empty = 0) => (den === 0 ? empty : num / den)

  // Timeline completeness – share of the timeline that is explained.
  const starts = entries.map((e) => earliestDay(e.startDate)).filter((x): x is number => x !== null)
  const span = starts.length ? t.day - Math.min(...starts) + 1 : 0
  const uncovered = v.openGaps.reduce((sum, g) => sum + (g.durationDaysApprox ?? 0), 0)
  const timeline = span > 0 ? Math.max(0, 1 - uncovered / span) * (v.openGaps.length ? 0.85 : 1) : 0

  // Required fields
  const withErrors = new Set(v.errors.filter((i) => i.timelineEntryId).map((i) => i.timelineEntryId))
  const required = ratio(v.entries.filter((e) => e.status !== 'draft' && !withErrors.has(e.id)).length, v.entries.length)

  // Verified names
  const eduOrgs = entries.filter(isEducation).map((e) => ('institution' in e ? e.institution : null)).filter(Boolean)
  const institutions = ratio(eduOrgs.filter((o) => o!.verificationStatus === 'verified').length, eduOrgs.length)
  const jobs = entries.filter((e) => e.type === 'professional_experience')
  const employers = ratio(jobs.filter((e) => e.type === 'professional_experience' && e.facility?.verificationStatus === 'verified').length, jobs.length, 1)

  // Date confidence
  const dates = entries.flatMap((e) => [e.startDate, e.ongoing ? null : e.endDate, 'diplomaDate' in e ? e.diplomaDate : null]).filter(Boolean)
  const confident = ratio(dates.filter((d) => ['day', 'month'].includes(precisionOf(d))).length, dates.length)

  const warn = Math.max(0, 1 - v.warnings.length / 5)

  const parts: QualityBreakdown['parts'] = [
    { key: 'timelineCompleteness', score: timeline * qualityWeights.timelineCompleteness, max: qualityWeights.timelineCompleteness },
    { key: 'requiredFields', score: required * qualityWeights.requiredFields, max: qualityWeights.requiredFields },
    { key: 'verifiedInstitutions', score: institutions * qualityWeights.verifiedInstitutions, max: qualityWeights.verifiedInstitutions },
    { key: 'verifiedEmployers', score: employers * qualityWeights.verifiedEmployers, max: qualityWeights.verifiedEmployers },
    { key: 'dateConfidence', score: confident * qualityWeights.dateConfidence, max: qualityWeights.dateConfidence },
    { key: 'warnings', score: warn * qualityWeights.warnings, max: qualityWeights.warnings },
  ]
  return { total: Math.round(parts.reduce((s, p) => s + p.score, 0)), parts }
}

/** Simple candidate-facing progress (no numeric quality score for the candidate). */
export function profileProgress(v: ProfileValidation): number {
  const done = v.entries.filter((e) => e.status !== 'draft')
  let p = 0
  if (done.some((e) => e.type === 'school')) p += 20
  if (done.some((e) => e.type === 'training')) p += 25
  if (done.some((e) => WORK_TYPES.includes(e.type))) p += 15
  if (done.length > 0 && v.openGaps.length === 0) p += 20
  if (done.length > 0 && v.errors.length === 0) p += 20
  return p
}
