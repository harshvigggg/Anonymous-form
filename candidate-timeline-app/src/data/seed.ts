import { newEntry } from '@/domain/entries/entries'
import { emptyReview } from '@/domain/timeline/review'
import { orgFromMaster } from '@/lib/normalization/orgName'
import { institutions, schools } from '@/config/institutions'
import { healthcareFacilities } from '@/config/healthcareFacilities'
import type { CandidateDoc, CandidateProfile } from '@/domain/timeline/types'

export const DEMO_TOKEN = 'demo'

export function emptyProfile(now = new Date().toISOString()): CandidateProfile {
  return { entries: [], confirmedOverlaps: {}, welcomeSeen: false, submittedAt: null, auditLog: [], rev: 0, updatedAt: now }
}

export function blankCandidate(id: string, token: string, fullName = '', phone: string | null = null): CandidateDoc {
  const now = new Date().toISOString()
  return { id, token, fullName, phone, createdAt: now, profile: emptyProfile(now), review: emptyReview(now) }
}

/**
 * Sample Indian nurse (from the specification). Two periods are deliberately
 * left unexplained so the gap flow can be tried straight away:
 *   Aug 2020 – Oct 2021 and Jan 2025 – Jul 2025.
 */
export function seedCandidate(id = 'cand-demo', token = DEMO_TOKEN): CandidateDoc {
  const doc = blankCandidate(id, token, 'Rohit Paswan', null)
  const now = doc.createdAt

  const school = newEntry('school', 'entry-demo-school', id, now)
  Object.assign(school, {
    schoolQualificationId: 'class12',
    institution: orgFromMaster(schools[0], 'Kendriya Vidyalaya No. 2'),
    startDate: '2019-04', startDatePrecision: 'month',
    endDate: '2020-07', endDatePrecision: 'month',
    diplomaDate: '2020-07-15', diplomaDatePrecision: 'day',
    city: 'Kanchrapara', cityId: 'in-kanchrapara', country: 'India',
    status: 'complete',
  })

  const training = newEntry('training', 'entry-demo-training', id, now)
  Object.assign(training, {
    qualificationId: 'gnm',
    homeQualificationId: 'gnm_3y',
    institution: orgFromMaster(institutions.find((i) => i.id === 'inst-oxford-nursing-blr')!, 'Oxford Nursing School'),
    startDate: '2021-11', startDatePrecision: 'month',
    endDate: '2024-12', endDatePrecision: 'month',
    diplomaDate: '2024-12-31', diplomaDatePrecision: 'day',
    city: 'Bengaluru', cityId: 'in-bengaluru', country: 'India',
    recognitionEligibility: 'eligible', recognitionSource: 'system',
    status: 'complete',
  })

  const job = newEntry('professional_experience', 'entry-demo-job', id, now)
  Object.assign(job, {
    jobTitleId: 'staff_nurse',
    facility: orgFromMaster(healthcareFacilities.find((f) => f.id === 'fac-gupta-nh-moradabad')!, 'gupta nusing home'),
    facilityTypeId: 'nursing_home',
    bedCountId: null, bedCountUnknown: true,
    departmentId: 'general_medicine',
    startDate: '2025-08', startDatePrecision: 'month',
    ongoing: true, endDate: null,
    employmentRelationshipId: 'full_time',
    city: 'Moradabad', cityId: 'in-moradabad', country: 'India',
    taskIds: ['medication', 'vitals', 'admission_discharge', 'wound_care', 'iv_care', 'documentation'],
    hasAdditionalTasks: false,
    additionalInfoSkipped: true,
    status: 'complete',
  })

  doc.profile.entries = [school, training, job]
  return doc
}
