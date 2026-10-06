import { z } from 'zod'
import { isCertainlyBefore, isInFuture, monthOf, precisionOf } from '@/domain/dates'
import { entryRules } from '@/config/validationRules'
import { byId } from '@/config/types'
import { trainingQualifications, schoolQualifications, homeQualificationNames } from '@/config/qualifications'
import { jobTitles } from '@/config/jobTitles'
import { facilityTypes, isInpatient } from '@/config/facilityTypes'
import { getDepartment, requiresConditions, requiresEquipment } from '@/config/departments'
import { careerBreakTypes } from '@/config/careerBreakTypes'
import { spellingChanged } from '@/lib/normalization/text'
import type {
  BaseEntry,
  CareerBreakEntry,
  EntryType,
  JobEntry,
  OrgName,
  SchoolEntry,
  Severity,
  TimelineEntry,
  TrainingEntry,
  ValidationCode,
  VolunteeringEntry,
} from '@/domain/timeline/types'

/**
 * Entry rules live here – one Zod schema per entry type.
 * The same schema powers the wizard (React Hook Form resolver) and the
 * profile-wide validation engine, so the two can never disagree.
 * Schemas only contain BLOCKING errors; warnings are in `entryWarnings`.
 */

export interface FieldIssue {
  field: string
  code: ValidationCode
  severity: Severity
  /** i18n key */
  message: string
  params?: Record<string, string | number>
}

type Add = (field: string, code: ValidationCode, message: string, params?: Record<string, string | number>) => void

function rules<T extends BaseEntry>(check: (v: T, add: Add) => void) {
  return z
    .custom<T>((v) => typeof v === 'object' && v !== null)
    .superRefine((v, ctx) => {
      check(v as T, (field, code, message, params) =>
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message, params: { code, ...params } }),
      )
    })
}

const blank = (s: string | null | undefined) => !s || !s.trim()

function requireChoice(add: Add, field: string, id: string | null | undefined, options: { id: string; requiresText?: boolean }[], textField: string, text: string) {
  if (!id) return add(field, 'REQUIRED_FIELD_MISSING', 'err.required')
  if (byId(options, id)?.requiresText && blank(text)) add(textField, 'REQUIRED_FIELD_MISSING', 'err.otherText')
}

function requireOrg(add: Add, field: string, org: OrgName | null) {
  if (!org || blank(org.rawValue)) add(field, 'REQUIRED_FIELD_MISSING', 'err.required')
}

function requireLocation(add: Add, v: BaseEntry) {
  if (blank(v.city)) add('city', 'REQUIRED_FIELD_MISSING', 'err.required')
  if (blank(v.country)) add('country', 'REQUIRED_FIELD_MISSING', 'err.required')
}

function checkDates(add: Add, v: BaseEntry, mode: 'fixedEnd' | 'mayBeOngoing') {
  if (!v.startDate) add('startDate', 'REQUIRED_FIELD_MISSING', 'err.required')
  else if (isInFuture(v.startDate)) add('startDate', 'DATE_IN_FUTURE', 'err.dateInFuture')

  if (mode === 'mayBeOngoing' && v.ongoing === null) add('ongoing', 'REQUIRED_FIELD_MISSING', 'err.answerRequired')
  if (v.ongoing && v.endDate) add('endDate', 'ONGOING_END_DATE_CONFLICT', 'err.ongoingConflict')

  const needsEnd = mode === 'fixedEnd' || v.ongoing === false
  if (needsEnd && !v.endDate) add('endDate', 'REQUIRED_FIELD_MISSING', 'err.required')
  if (needsEnd && v.endDate) {
    if (v.startDate && isCertainlyBefore(v.endDate, v.startDate)) add('endDate', 'INVALID_DATE_ORDER', 'err.endBeforeStart')
    else if (isInFuture(v.endDate)) add('endDate', 'DATE_IN_FUTURE', 'err.dateInFuture')
  }
}

function checkDiploma(add: Add, v: { endDate: string | null; diplomaDate: string | null }) {
  if (!v.diplomaDate) return add('diplomaDate', 'REQUIRED_FIELD_MISSING', 'err.required')
  if (isInFuture(v.diplomaDate)) return add('diplomaDate', 'DATE_IN_FUTURE', 'err.dateInFuture')
  const diplomaLatest = monthOf(v.diplomaDate, 'last')
  const endEarliest = monthOf(v.endDate, 'first')
  if (diplomaLatest !== null && endEarliest !== null && diplomaLatest < endEarliest - entryRules.diplomaEarlyBlockingMonths) {
    add('diplomaDate', 'INVALID_DATE_ORDER', 'err.diplomaBeforeEnd')
  }
}

export const trainingSchema = rules<TrainingEntry>((v, add) => {
  requireChoice(add, 'qualificationId', v.qualificationId, trainingQualifications, 'otherQualification', v.otherQualification)
  requireChoice(add, 'homeQualificationId', v.homeQualificationId, homeQualificationNames, 'otherHomeQualification', v.otherHomeQualification)
  requireOrg(add, 'institution', v.institution)
  checkDates(add, v, 'fixedEnd')
  checkDiploma(add, v)
  requireLocation(add, v)
})

export const schoolSchema = rules<SchoolEntry>((v, add) => {
  requireChoice(add, 'schoolQualificationId', v.schoolQualificationId, schoolQualifications, 'otherSchoolQualification', v.otherSchoolQualification)
  requireOrg(add, 'institution', v.institution)
  checkDates(add, v, 'fixedEnd')
  checkDiploma(add, v)
  requireLocation(add, v)
})

export const jobSchema = rules<JobEntry>((v, add) => {
  requireChoice(add, 'jobTitleId', v.jobTitleId, jobTitles, 'otherJobTitle', v.otherJobTitle)
  requireOrg(add, 'facility', v.facility)
  requireChoice(add, 'facilityTypeId', v.facilityTypeId, facilityTypes, 'otherFacilityType', v.otherFacilityType)
  if (isInpatient(v.facilityTypeId) && !v.bedCountId && !v.bedCountUnknown) add('bedCountId', 'REQUIRED_FIELD_MISSING', 'err.chooseOne')

  if (!v.departmentId) add('departmentId', 'DEPARTMENT_REQUIRED', 'err.departmentRequired')
  else if (getDepartment(v.departmentId)?.requiresText && blank(v.otherDepartment)) add('otherDepartment', 'REQUIRED_FIELD_MISSING', 'err.otherText')

  checkDates(add, v, 'mayBeOngoing')
  if (!v.employmentRelationshipId) add('employmentRelationshipId', 'REQUIRED_FIELD_MISSING', 'err.chooseOne')
  requireLocation(add, v)

  if (v.taskIds.length < entryRules.minTasks) add('taskIds', 'TASK_REQUIRED', 'err.tasksRequired')
  if (v.taskIds.length > entryRules.maxTasks) add('taskIds', 'TOO_MANY_TASKS', 'err.tooManyTasks', { max: entryRules.maxTasks })
  if (v.hasAdditionalTasks === null) add('hasAdditionalTasks', 'REQUIRED_FIELD_MISSING', 'err.answerRequired')
  if (v.hasAdditionalTasks && blank(v.additionalTasks)) add('additionalTasks', 'REQUIRED_FIELD_MISSING', 'err.additionalTasksText')

  const dept = getDepartment(v.departmentId)?.label ?? ''
  if (requiresConditions(v.departmentId)) {
    if (v.conditionIds.length === 0) add('conditionIds', 'CONDITIONS_REQUIRED', 'err.conditionsRequired', { department: dept })
    else if (v.conditionIds.includes('other') && blank(v.otherConditions)) add('otherConditions', 'REQUIRED_FIELD_MISSING', 'err.otherText')
  }
  if (requiresEquipment(v.departmentId)) {
    if (v.equipmentIds.length === 0) add('equipmentIds', 'EQUIPMENT_REQUIRED', 'err.equipmentRequired', { department: dept })
    else if (v.equipmentIds.includes('other') && blank(v.otherEquipment)) add('otherEquipment', 'REQUIRED_FIELD_MISSING', 'err.otherText')
  }
})

export const careerBreakSchema = rules<CareerBreakEntry>((v, add) => {
  requireChoice(add, 'breakTypeId', v.breakTypeId, careerBreakTypes, 'otherBreakType', v.otherBreakType)
  checkDates(add, v, 'mayBeOngoing')
  if (v.sameCityAsPrevious === null && v.previousCityEntryId) add('sameCityAsPrevious', 'REQUIRED_FIELD_MISSING', 'err.answerRequired')
  requireLocation(add, v)
})

export const volunteeringSchema = rules<VolunteeringEntry>((v, add) => {
  if (blank(v.purpose)) add('purpose', 'REQUIRED_FIELD_MISSING', 'err.required')
  checkDates(add, v, 'mayBeOngoing')
  requireLocation(add, v)
})

export const entrySchemas: Record<EntryType, z.ZodTypeAny> = {
  training: trainingSchema,
  school: schoolSchema,
  professional_experience: jobSchema,
  career_break: careerBreakSchema,
  volunteering: volunteeringSchema,
}

/** Blocking errors for one entry. */
export function entryErrors(entry: TimelineEntry): FieldIssue[] {
  const result = entrySchemas[entry.type].safeParse(entry)
  if (result.success) return []
  return result.error.issues.map((i) => {
    const params = ('params' in i ? (i.params as Record<string, string | number>) : {}) ?? {}
    const { code, ...rest } = params
    return {
      field: String(i.path[0] ?? ''),
      code: (code as ValidationCode) ?? 'REQUIRED_FIELD_MISSING',
      severity: 'error' as const,
      message: i.message,
      params: rest,
    }
  })
}

// ---------------------------------------------------------------------------
// Warnings – never block the candidate, always reach the executive.
// ---------------------------------------------------------------------------

function orgWarnings(org: OrgName | null, field: string, unverifiedCode: ValidationCode): FieldIssue[] {
  if (!org || blank(org.rawValue)) return []
  const out: FieldIssue[] = []
  if (org.verificationStatus !== 'verified') {
    out.push({ field, code: unverifiedCode, severity: 'warning', message: `warn.${unverifiedCode}` })
    if (spellingChanged(org.rawValue, org.normalizedValue)) {
      out.push({ field, code: 'NAME_NORMALIZED', severity: 'warning', message: 'warn.NAME_NORMALIZED' })
    }
  } else if (org.germanStatus !== 'verified') {
    out.push({ field, code: 'GERMAN_NAME_UNVERIFIED', severity: 'warning', message: 'warn.GERMAN_NAME_UNVERIFIED' })
  }
  return out
}

function precisionWarnings(v: BaseEntry & { diplomaDate?: string | null }): FieldIssue[] {
  const fields = ['startDate', 'endDate', 'diplomaDate'] as const
  const low = fields.filter((f) => {
    const value = (v as unknown as Record<string, string | null | undefined>)[f]
    if (!value || (f === 'endDate' && v.ongoing)) return false
    return precisionOf(value) === 'year'
  })
  return low.length
    ? [{ field: low[0], code: 'DATE_PRECISION_LOW', severity: 'warning', message: 'warn.DATE_PRECISION_LOW', params: { fields: low.join(',') } }]
    : []
}

function diplomaWarnings(v: { endDate: string | null; diplomaDate: string | null }): FieldIssue[] {
  const d = monthOf(v.diplomaDate, 'first')
  const e = monthOf(v.endDate, 'last')
  if (d === null || e === null) return []
  if (d - e > entryRules.diplomaLateMonths) {
    return [{ field: 'diplomaDate', code: 'DIPLOMA_DATE_SUSPICIOUS', severity: 'warning', message: 'warn.DIPLOMA_LATE', params: { months: d - e } }]
  }
  const dLatest = monthOf(v.diplomaDate, 'last')
  const eEarliest = monthOf(v.endDate, 'first')
  if (dLatest !== null && eEarliest !== null && dLatest < eEarliest) {
    return [{ field: 'diplomaDate', code: 'DIPLOMA_DATE_SUSPICIOUS', severity: 'warning', message: 'warn.DIPLOMA_EARLY' }]
  }
  return []
}

export function entryWarnings(entry: TimelineEntry): FieldIssue[] {
  switch (entry.type) {
    case 'training': {
      const out = [...orgWarnings(entry.institution, 'institution', 'INSTITUTION_UNVERIFIED'), ...precisionWarnings(entry), ...diplomaWarnings(entry)]
      // "Other" names (and uncertain qualifications, which map to "other") need an executive mapping.
      if (entry.homeQualificationId === 'other') {
        out.push({ field: 'homeQualificationId', code: 'QUALIFICATION_MAPPING_UNKNOWN', severity: 'warning', message: 'warn.QUALIFICATION_MAPPING_UNKNOWN' })
      }
      if (entry.recognitionEligibility === 'unknown') {
        out.push({ field: 'recognitionEligibility', code: 'RECOGNITION_UNCONFIRMED', severity: 'warning', message: 'warn.RECOGNITION_UNCONFIRMED' })
      }
      return out
    }
    case 'school':
      return [...orgWarnings(entry.institution, 'institution', 'INSTITUTION_UNVERIFIED'), ...precisionWarnings(entry), ...diplomaWarnings(entry)]
    case 'professional_experience': {
      const out = [...orgWarnings(entry.facility, 'facility', 'FACILITY_UNVERIFIED'), ...precisionWarnings(entry)]
      if (isInpatient(entry.facilityTypeId) && entry.bedCountUnknown) {
        out.push({ field: 'bedCountId', code: 'BED_COUNT_UNKNOWN', severity: 'warning', message: 'warn.BED_COUNT_UNKNOWN' })
      }
      return out
    }
    case 'career_break':
    case 'volunteering':
      return precisionWarnings(entry)
  }
}
