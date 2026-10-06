import { describe, expect, it } from 'vitest'
import { today, type Today } from '@/domain/dates'
import { newEntry } from '@/domain/entries/entries'
import { entryErrors, entryWarnings } from '@/domain/entries/schemas'
import { orgFromCandidate } from '@/lib/normalization/orgName'
import { normalizeName } from '@/lib/normalization/text'
import { emptyReview } from './review'
import { detectTimelineGaps } from './gapDetector'
import { detectOverlaps } from './overlapDetector'
import { validateProfile } from './validators'
import { seedCandidate, emptyProfile } from '@/data/seed'
import type { TimelineEntry } from './types'

const T: Today = today(new Date(2026, 9, 6)) // 6 Oct 2026

let n = 0
function entry<T extends TimelineEntry['type']>(type: T, patch: Record<string, unknown>) {
  const e = newEntry(type, `e${++n}`, 'c1', '2026-01-01T00:00:00Z')
  return Object.assign(e, { status: 'complete' }, patch) as TimelineEntry
}

const training = (start: string, end: string) => entry('training', { startDate: start, endDate: end })
const job = (start: string, end: string | null) => entry('professional_experience', { startDate: start, endDate: end, ongoing: end === null })

describe('gap detection', () => {
  it('Training Dec 2024 → Job Jan 2025: no gap', () => {
    expect(detectTimelineGaps([training('2021-11', '2024-12'), job('2025-01', null)], { today: T })).toEqual([])
  })

  it('Training Dec 2024 → Job Aug 2025: Jan–Jul 2025 gap', () => {
    const gaps = detectTimelineGaps([training('2021-11', '2024-12'), job('2025-08', null)], { today: T })
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ startDate: '2025-01', endDate: '2025-07', durationMonthsApprox: 7, startDatePrecision: 'month' })
  })

  it('School 2020 (year only) → Training Nov 2021: gap Jan–Oct 2021', () => {
    const school = entry('school', { startDate: '2018', endDate: '2020' })
    const gaps = detectTimelineGaps([school, training('2021-11', '2024-12'), job('2025-01', null)], { today: T })
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ startDate: '2021-01', endDate: '2021-10' })
  })

  it('spec example: two missing periods', () => {
    const school = entry('school', { startDate: '2019-04', endDate: '2020-07' })
    const gaps = detectTimelineGaps([school, training('2021-11', '2024-12'), job('2025-08', null)], { today: T })
    expect(gaps.map((g) => `${g.startDate}→${g.endDate}`)).toEqual(['2020-08→2021-10', '2025-01→2025-07'])
  })

  it('does not create fake day-level gaps for month dates', () => {
    expect(detectTimelineGaps([training('2021-11', '2024-12'), job('2025-02', null)], { today: T })).toHaveLength(1)
    expect(detectTimelineGaps([training('2021-11', '2024-12-20'), job('2025-01-10', null)], { today: T })).toHaveLength(0)
  })

  it('detects a gap from the last activity up to today', () => {
    const gaps = detectTimelineGaps([training('2021-11', '2024-12')], { today: T })
    expect(gaps).toHaveLength(1)
    expect(gaps[0]).toMatchObject({ startDate: '2025-01', endIsPresent: true })
  })

  it('ignores drafts and handles overlapping coverage', () => {
    const draft = entry('professional_experience', { startDate: '2025-01', endDate: '2025-07', ongoing: false, status: 'draft' })
    const a = training('2021-11', '2024-12')
    const b = job('2023-01', null)
    expect(detectTimelineGaps([a, b, draft], { today: T })).toEqual([])
  })
})

describe('overlaps', () => {
  it('flags real overlaps but not a shared boundary month', () => {
    const a = training('2021-11', '2024-12')
    expect(detectOverlaps([a, job('2024-12', null)], {}, T)).toHaveLength(0)
    const o = detectOverlaps([a, job('2023-06', '2024-12')], {}, T)
    expect(o).toHaveLength(1)
    expect(o[0].confirmed).toBe(false)
  })
})

describe('date validation', () => {
  it('Start Aug 2025 → End Jul 2025 is a blocking error', () => {
    const e = entry('career_break', { breakTypeId: 'job_seeking', startDate: '2025-08', endDate: '2025-07', ongoing: false, city: 'Kalyani', country: 'India', sameCityAsPrevious: false })
    expect(entryErrors(e).map((i) => i.code)).toContain('INVALID_DATE_ORDER')
  })

  it('ongoing job without end date is valid', () => {
    const e = completeJob({ ongoing: true, endDate: null })
    expect(entryErrors(e)).toEqual([])
  })

  it('diploma date clearly before course end is blocking', () => {
    const e = entry('training', {
      qualificationId: 'gnm', homeQualificationId: 'gnm_3y', institution: orgFromCandidate('x nursing school'),
      startDate: '2021-11', endDate: '2024-12', diplomaDate: '2024-06-01', city: 'Patna', country: 'India',
    })
    expect(entryErrors(e).map((i) => i.field)).toContain('diplomaDate')
  })
})

function completeJob(patch: Record<string, unknown> = {}) {
  return entry('professional_experience', {
    jobTitleId: 'staff_nurse', facility: orgFromCandidate('city hospital'), facilityTypeId: 'hospital', bedCountId: '101_250',
    departmentId: 'general_medicine', startDate: '2025-01', ongoing: true, employmentRelationshipId: 'full_time',
    city: 'Patna', country: 'India', taskIds: ['vitals'], hasAdditionalTasks: false, ...patch,
  })
}

describe('job rules', () => {
  it('ICU with no equipment is a blocking error', () => {
    const codes = entryErrors(completeJob({ departmentId: 'icu', conditionIds: ['sepsis'], equipmentIds: [] })).map((i) => i.code)
    expect(codes).toContain('EQUIPMENT_REQUIRED')
  })

  it('no tasks is a blocking error', () => {
    expect(entryErrors(completeJob({ taskIds: [] })).map((i) => i.code)).toContain('TASK_REQUIRED')
  })

  it('more than 15 tasks is a blocking error', () => {
    const many = Array.from({ length: 16 }, (_, i) => `t${i}`)
    expect(entryErrors(completeJob({ taskIds: many })).map((i) => i.code)).toContain('TOO_MANY_TASKS')
  })

  it('unknown bed count in a hospital is a warning, not an error', () => {
    const e = completeJob({ bedCountId: null, bedCountUnknown: true })
    expect(entryErrors(e)).toEqual([])
    expect(entryWarnings(e).map((i) => i.code)).toContain('BED_COUNT_UNKNOWN')
  })
})

describe('profile validation', () => {
  it('sample candidate has two unresolved gaps and cannot submit', () => {
    const doc = seedCandidate()
    const v = validateProfile(doc.profile, doc.review, { today: T })
    expect(v.openGaps).toHaveLength(2)
    expect(v.canSubmit).toBe(false)
  })

  it('an executive-accepted gap no longer blocks', () => {
    const doc = seedCandidate()
    const v1 = validateProfile(doc.profile, doc.review, { today: T })
    const review = emptyReview()
    for (const g of v1.gaps) review.issueDecisions[`UNRESOLVED_TIMELINE_GAP:${g.key}:`] = { status: 'accepted_by_admin', at: 'x', by: 'exec' }
    const v2 = validateProfile(doc.profile, review, { today: T })
    expect(v2.openGaps).toHaveLength(0)
    expect(v2.canSubmit).toBe(true)
  })

  it('empty profile requires school and nursing education', () => {
    const v = validateProfile(emptyProfile(), emptyReview(), { today: T })
    expect(v.errors.map((e) => e.code)).toEqual(['REQUIRED_SECTION_MISSING', 'REQUIRED_SECTION_MISSING'])
  })
})

describe('normalisation', () => {
  it('fixes spelling and case without touching the raw value', () => {
    expect(normalizeName('oxford nusing school')).toBe('Oxford Nursing School')
    expect(normalizeName('gupta nusing home')).toBe('Gupta Nursing Home')
    expect(normalizeName('AIIMS new delhi')).toBe('AIIMS New Delhi')
    const org = orgFromCandidate('oxford nusing school')
    expect(org.rawValue).toBe('oxford nusing school')
    expect(org.verificationStatus).toBe('needs_review')
  })
})
