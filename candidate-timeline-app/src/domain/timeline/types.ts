import type { DatePrecision } from '@/domain/dates'

export type { DatePrecision }

export type EntryType = 'training' | 'school' | 'professional_experience' | 'career_break' | 'volunteering'

export type EntryStatus = 'draft' | 'complete' | 'needs_review' | 'verified'

export type VerificationStatus = 'verified' | 'needs_review'

/**
 * An institution / school / hospital name as entered by the candidate.
 * The raw value is never overwritten.
 */
export interface OrgName {
  rawValue: string
  normalizedValue: string
  /** Name used in the German target record. Never typed by the candidate. */
  germanValue: string | null
  germanStatus: 'verified' | 'generated' | 'missing'
  verifiedValue: string | null
  masterId: string | null
  source: 'master' | 'candidate'
  verificationStatus: VerificationStatus
}

export interface EvidenceFile {
  id: string
  fileName: string
  mimeType: string
  sizeKb: number
  storage: 'local' | 'remote'
  path: string
  uploadedAt: string
}

export interface BaseEntry {
  id: string
  candidateId: string
  type: EntryType

  startDate: string | null
  startDatePrecision: DatePrecision

  endDate: string | null
  endDatePrecision: DatePrecision

  /** null = not answered yet */
  ongoing: boolean | null

  city: string | null
  cityId: string | null
  country: string | null

  status: EntryStatus
  createdAt: string
  updatedAt: string
  /** Wizard step to resume from (drafts only). */
  wizardStep?: string | null
}

export interface TrainingEntry extends BaseEntry {
  type: 'training'
  qualificationId: string | null
  otherQualification: string
  homeQualificationId: string | null
  otherHomeQualification: string
  institution: OrgName | null
  diplomaDate: string | null
  diplomaDatePrecision: DatePrecision
  /** Internal – set by system mapping or by an executive. */
  recognitionEligibility: 'eligible' | 'not_eligible' | 'unknown'
  recognitionSource: 'system' | 'executive' | null
  evidence: EvidenceFile | null
  evidenceSkipped: boolean
}

export interface SchoolEntry extends BaseEntry {
  type: 'school'
  schoolQualificationId: string | null
  otherSchoolQualification: string
  institution: OrgName | null
  diplomaDate: string | null
  diplomaDatePrecision: DatePrecision
}

export interface JobEntry extends BaseEntry {
  type: 'professional_experience'
  jobTitleId: string | null
  otherJobTitle: string
  facility: OrgName | null
  facilityTypeId: string | null
  otherFacilityType: string
  bedCountId: string | null
  bedCountUnknown: boolean
  departmentId: string | null
  otherDepartment: string
  employmentRelationshipId: string | null
  taskIds: string[]
  hasAdditionalTasks: boolean | null
  additionalTasks: string
  additionalInfo: string
  additionalInfoSkipped: boolean
  conditionIds: string[]
  otherConditions: string
  equipmentIds: string[]
  otherEquipment: string
}

export interface CareerBreakEntry extends BaseEntry {
  type: 'career_break'
  breakTypeId: string | null
  otherBreakType: string
  sameCityAsPrevious: boolean | null
  previousCityEntryId: string | null
  /** Set when this break was created from a detected gap. */
  sourceGapKey: string | null
  editDates: boolean
}

export interface VolunteeringEntry extends BaseEntry {
  type: 'volunteering'
  purpose: string
}

export type TimelineEntry = TrainingEntry | SchoolEntry | JobEntry | CareerBreakEntry | VolunteeringEntry

export type EntryOf<T extends EntryType> = Extract<TimelineEntry, { type: T }>

export interface TimelineGap {
  id: string
  /** Stable key built from the gap's dates. */
  key: string
  candidateId: string
  startDate: string
  startDatePrecision: DatePrecision
  endDate: string
  endDatePrecision: DatePrecision
  /** Gap runs up to today (nothing ongoing). */
  endIsPresent: boolean
  durationDaysApprox: number | null
  durationMonthsApprox: number
  previousEntryId: string | null
  nextEntryId: string | null
  status: 'unresolved' | 'resolved' | 'ignored_by_admin'
}

export interface TimelineOverlap {
  id: string
  entryIdA: string
  entryIdB: string
  /** Changes when either entry's dates change, so old confirmations expire. */
  signature: string
  months: number
  confirmed: boolean
}

export type Severity = 'error' | 'warning' | 'info'

export type ValidationCode =
  | 'REQUIRED_FIELD_MISSING'
  | 'REQUIRED_SECTION_MISSING'
  | 'ENTRY_UNFINISHED'
  | 'INVALID_DATE_ORDER'
  | 'DATE_IN_FUTURE'
  | 'ONGOING_END_DATE_CONFLICT'
  | 'DUPLICATE_ENTRY'
  | 'UNRESOLVED_TIMELINE_GAP'
  | 'TIMELINE_OVERLAP'
  | 'TIMELINE_OVERLAP_CONFIRMED'
  | 'INSTITUTION_UNVERIFIED'
  | 'FACILITY_UNVERIFIED'
  | 'NAME_NORMALIZED'
  | 'GERMAN_NAME_UNVERIFIED'
  | 'BED_COUNT_UNKNOWN'
  | 'DEPARTMENT_REQUIRED'
  | 'TASK_REQUIRED'
  | 'TOO_MANY_TASKS'
  | 'CONDITIONS_REQUIRED'
  | 'EQUIPMENT_REQUIRED'
  | 'DIPLOMA_DATE_SUSPICIOUS'
  | 'DATE_PRECISION_LOW'
  | 'QUALIFICATION_MAPPING_UNKNOWN'
  | 'RECOGNITION_UNCONFIRMED'

export interface ValidationIssue {
  id: string
  candidateId: string
  timelineEntryId?: string
  gapKey?: string
  overlapId?: string
  field?: string
  code: ValidationCode
  severity: Severity
  /** i18n key for the message */
  message: string
  params?: Record<string, string | number>
  status: 'open' | 'resolved' | 'accepted_by_admin'
  createdAt: string
  resolvedAt?: string
}

export type ChangedByType = 'system' | 'candidate' | 'executive'

export interface AuditLogEntry {
  id: string
  entryId: string | null
  field: string
  previousValue: string | null
  newValue: string | null
  changedByType: ChangedByType
  changedById: string
  changedAt: string
}

/** Everything the candidate owns. */
export interface CandidateProfile {
  entries: TimelineEntry[]
  /** overlapId → signature confirmed by the candidate */
  confirmedOverlaps: Record<string, string>
  welcomeSeen: boolean
  submittedAt: string | null
  auditLog: AuditLogEntry[]
  rev: number
  updatedAt: string
}

export interface EntryOverride {
  at: string
  by: string
  institution?: OrgName
  facility?: OrgName
  bedCountId?: string | null
  bedCountUnknown?: boolean
  homeQualificationId?: string | null
  recognitionEligibility?: TrainingEntry['recognitionEligibility']
  recognitionSource?: TrainingEntry['recognitionSource']
}

export interface IssueDecision {
  status: 'accepted_by_admin'
  at: string
  by: string
  note?: string
}

/** Everything the executive owns. Kept separate so both sides never overwrite each other. */
export interface ExecutiveReview {
  entryOverrides: Record<string, EntryOverride>
  issueDecisions: Record<string, IssueDecision>
  verifiedAt: string | null
  verifiedBy: string | null
  reopenedAt: string | null
  reopenNote: string | null
  auditLog: AuditLogEntry[]
  updatedAt: string
}

export interface CandidateDoc {
  id: string
  token: string
  fullName: string
  phone: string | null
  createdAt: string
  profile: CandidateProfile
  review: ExecutiveReview
}

export type CandidateStatus = 'in_progress' | 'submitted' | 'verified'
