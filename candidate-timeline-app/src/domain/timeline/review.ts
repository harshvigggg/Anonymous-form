import type { CandidateDoc, CandidateStatus, ExecutiveReview, TimelineEntry } from './types'

/**
 * Executive corrections are stored separately from candidate answers.
 * An override applies only while the candidate has not edited the entry since.
 */
export function applyOverrides(entries: TimelineEntry[], review: ExecutiveReview): TimelineEntry[] {
  return entries.map((e) => {
    const o = review.entryOverrides[e.id]
    if (!o || e.updatedAt > o.at) return e
    const m = { ...e } as TimelineEntry & Record<string, unknown>
    if (o.institution && (m.type === 'training' || m.type === 'school')) m.institution = o.institution
    if (o.facility && m.type === 'professional_experience') m.facility = o.facility
    if (m.type === 'professional_experience') {
      if (o.bedCountId !== undefined) m.bedCountId = o.bedCountId
      if (o.bedCountUnknown !== undefined) m.bedCountUnknown = o.bedCountUnknown
    }
    if (m.type === 'training') {
      if (o.homeQualificationId !== undefined) m.homeQualificationId = o.homeQualificationId
      if (o.recognitionEligibility !== undefined) m.recognitionEligibility = o.recognitionEligibility
      if (o.recognitionSource !== undefined) m.recognitionSource = o.recognitionSource
    }
    return m
  })
}

export function candidateStatus(doc: Pick<CandidateDoc, 'profile' | 'review'>): CandidateStatus {
  const { submittedAt } = doc.profile
  const { verifiedAt, reopenedAt } = doc.review
  if (!submittedAt) return 'in_progress'
  if (reopenedAt && reopenedAt > submittedAt) return 'in_progress'
  if (verifiedAt && verifiedAt >= submittedAt) return 'verified'
  return 'submitted'
}

export function emptyReview(now = new Date().toISOString()): ExecutiveReview {
  return {
    entryOverrides: {},
    issueDecisions: {},
    verifiedAt: null,
    verifiedBy: null,
    reopenedAt: null,
    reopenNote: null,
    auditLog: [],
    updatedAt: now,
  }
}
