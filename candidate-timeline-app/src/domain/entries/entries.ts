import { byId } from '@/config/types'
import { trainingQualifications, schoolQualifications, homeQualificationNames } from '@/config/qualifications'
import { jobTitles } from '@/config/jobTitles'
import { careerBreakTypes } from '@/config/careerBreakTypes'
import { getDepartment } from '@/config/departments'
import { employmentRelationships } from '@/config/employmentRelationships'
import { formatRange } from '@/domain/dates'
import { displayOrg } from '@/lib/normalization/orgName'
import type {
  BaseEntry,
  CareerBreakEntry,
  EntryOf,
  EntryType,
  JobEntry,
  SchoolEntry,
  TimelineEntry,
  TrainingEntry,
  VolunteeringEntry,
} from '@/domain/timeline/types'

export const EDUCATION_TYPES: EntryType[] = ['school', 'training']
export const WORK_TYPES: EntryType[] = ['professional_experience', 'career_break', 'volunteering']

export function isEducation(e: TimelineEntry): boolean {
  return EDUCATION_TYPES.includes(e.type)
}

function base(type: EntryType, id: string, candidateId: string, now: string): BaseEntry {
  return {
    id,
    candidateId,
    type,
    startDate: null,
    startDatePrecision: 'unknown',
    endDate: null,
    endDatePrecision: 'unknown',
    ongoing: type === 'training' || type === 'school' ? false : null,
    city: null,
    cityId: null,
    country: null,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    wizardStep: null,
  }
}

export function newEntry<T extends EntryType>(type: T, id: string, candidateId: string, now = new Date().toISOString()): EntryOf<T> {
  const b = base(type, id, candidateId, now)
  switch (type) {
    case 'training': {
      const e: TrainingEntry = {
        ...b, type: 'training',
        qualificationId: null, otherQualification: '', homeQualificationId: null, otherHomeQualification: '',
        institution: null, diplomaDate: null, diplomaDatePrecision: 'unknown',
        recognitionEligibility: 'unknown', recognitionSource: null, evidence: null, evidenceSkipped: false,
      }
      return e as EntryOf<T>
    }
    case 'school': {
      const e: SchoolEntry = {
        ...b, type: 'school',
        schoolQualificationId: null, otherSchoolQualification: '', institution: null, diplomaDate: null, diplomaDatePrecision: 'unknown',
      }
      return e as EntryOf<T>
    }
    case 'professional_experience': {
      const e: JobEntry = {
        ...b, type: 'professional_experience',
        jobTitleId: null, otherJobTitle: '', facility: null, facilityTypeId: null, otherFacilityType: '',
        bedCountId: null, bedCountUnknown: false, departmentId: null, otherDepartment: '', employmentRelationshipId: null,
        taskIds: [], hasAdditionalTasks: null, additionalTasks: '', additionalInfo: '', additionalInfoSkipped: false,
        conditionIds: [], otherConditions: '', equipmentIds: [], otherEquipment: '',
      }
      return e as EntryOf<T>
    }
    case 'career_break': {
      const e: CareerBreakEntry = {
        ...b, type: 'career_break',
        breakTypeId: null, otherBreakType: '', sameCityAsPrevious: null, previousCityEntryId: null, sourceGapKey: null, editDates: false,
      }
      return e as EntryOf<T>
    }
    default: {
      const e: VolunteeringEntry = { ...b, type: 'volunteering', purpose: '' }
      return e as EntryOf<T>
    }
  }
}

export const entryIcons: Record<EntryType, string> = {
  training: '🎓',
  school: '🏫',
  professional_experience: '🏥',
  career_break: '⏸',
  volunteering: '❤️',
}

/** Main line on a timeline card, e.g. "GNM Nursing" or "Staff Nurse". */
export function entryTitle(e: TimelineEntry): string {
  switch (e.type) {
    case 'training': {
      const q = byId(trainingQualifications, e.qualificationId)
      if (!q) return 'Nursing / College Education'
      if (q.id === 'other') return e.otherQualification || 'Other qualification'
      if (q.mappingUncertain && e.otherHomeQualification) return e.otherHomeQualification
      return q.short ?? q.label
    }
    case 'school': {
      const q = byId(schoolQualifications, e.schoolQualificationId)
      if (!q) return 'School Education'
      return q.requiresText ? e.otherSchoolQualification || q.label : q.short ?? q.label
    }
    case 'professional_experience': {
      const j = byId(jobTitles, e.jobTitleId)
      if (!j) return 'Job'
      return j.requiresText ? e.otherJobTitle || 'Job' : j.short ?? j.label
    }
    case 'career_break': {
      const b = byId(careerBreakTypes, e.breakTypeId)
      if (!b) return 'Career Break'
      return b.requiresText ? e.otherBreakType || 'Career Break' : b.short
    }
    case 'volunteering':
      return e.purpose || 'Volunteering'
  }
}

/** Second line: institution / hospital or a category label. */
export function entrySubtitle(e: TimelineEntry): string {
  switch (e.type) {
    case 'training':
    case 'school':
      return displayOrg(e.institution)
    case 'professional_experience':
      return displayOrg(e.facility)
    case 'career_break':
      return 'Career Break'
    case 'volunteering':
      return 'Volunteering'
  }
}

export function entryLocation(e: TimelineEntry): string {
  return [e.city, e.country].filter(Boolean).join(', ')
}

export function entryDates(e: TimelineEntry, presentLabel = 'Present'): string {
  if (!e.startDate) return ''
  return formatRange(e.startDate, e.endDate, e.ongoing, presentLabel)
}

/** Extra detail lines for the review page. */
export function entryDetails(e: TimelineEntry): string[] {
  switch (e.type) {
    case 'training': {
      const home = byId(homeQualificationNames, e.homeQualificationId)
      return [home && home.id !== 'other' ? home.label : e.otherHomeQualification].filter(Boolean)
    }
    case 'professional_experience': {
      const d = getDepartment(e.departmentId)
      const er = byId(employmentRelationships, e.employmentRelationshipId)
      return [d ? (d.requiresText ? e.otherDepartment : d.label) : '', er?.label ?? ''].filter(Boolean)
    }
    default:
      return []
  }
}

export function entryEditPath(token: string, e: Pick<TimelineEntry, 'type' | 'id'>, step?: string): string {
  const seg: Record<EntryType, string> = {
    training: 'education/training',
    school: 'education/school',
    professional_experience: 'experience/job',
    career_break: 'experience/career-break',
    volunteering: 'experience/volunteering',
  }
  return `/candidate/${token}/${seg[e.type]}/${e.id}${step ? `?step=${step}` : ''}`
}

export function newEntryPath(token: string, type: EntryType, query = ''): string {
  return entryEditPath(token, { type, id: 'new' }) + query
}
