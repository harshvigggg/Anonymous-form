import { byId } from '@/config/types'
import { homeQualificationNames, schoolQualifications, trainingQualifications } from '@/config/qualifications'
import { jobTitles } from '@/config/jobTitles'
import { bedCountOptions, facilityTypes } from '@/config/facilityTypes'
import { departments } from '@/config/departments'
import { employmentRelationships } from '@/config/employmentRelationships'
import { tasks } from '@/config/tasks'
import { conditions } from '@/config/conditions'
import { equipment } from '@/config/equipment'
import { careerBreakTypes } from '@/config/careerBreakTypes'
import { targetFieldNames as F, targetSections } from '@/config/targetFields'
import type { CandidateDoc, OrgName, TimelineEntry } from '@/domain/timeline/types'
import { earliestDay } from '@/domain/dates'

/**
 * Converts the verified timeline into records that use the target system's
 * exact field names and controlled values – so every executive enters the
 * same data the same way.
 */
const org = (o: OrgName | null) => o?.verifiedValue || o?.normalizedValue || ''
const opt = (list: { id: string; target: string }[], id: string | null) => byId(list, id)?.target ?? ''
const many = (list: { id: string; target: string }[], ids: string[]) => ids.filter((i) => i !== 'other').map((i) => opt(list, i))
const date = (value: string | null, precision: string) => (value ? { value, precision } : null)

export function toTargetRecord(e: TimelineEntry): Record<string, unknown> {
  const base = { section: targetSections[e.type] }
  const end = e.ongoing ? null : date(e.endDate, e.endDatePrecision)
  switch (e.type) {
    case 'training':
      return {
        ...base,
        [F.training.degree]: opt(trainingQualifications, e.qualificationId),
        [F.training.otherDegree]: e.otherQualification || null,
        [F.training.homeName]: e.homeQualificationId === 'other' ? 'Other' : opt(homeQualificationNames, e.homeQualificationId),
        [F.training.otherHomeName]: e.otherHomeQualification || null,
        [F.training.institution]: org(e.institution),
        [F.training.institutionGerman]: e.institution?.germanValue ?? null,
        [F.training.startDate]: date(e.startDate, e.startDatePrecision),
        [F.training.endDate]: end,
        [F.training.diplomaDate]: date(e.diplomaDate, e.diplomaDatePrecision),
        [F.training.city]: e.city,
        [F.training.country]: e.country,
        [F.training.recognition]: e.recognitionEligibility,
      }
    case 'school':
      return {
        ...base,
        [F.school.classification]: e.schoolQualificationId === 'other_school' ? e.otherSchoolQualification : opt(schoolQualifications, e.schoolQualificationId),
        [F.school.institution]: org(e.institution),
        [F.school.institutionGerman]: e.institution?.germanValue ?? null,
        [F.school.startDate]: date(e.startDate, e.startDatePrecision),
        [F.school.endDate]: end,
        [F.school.diplomaDate]: date(e.diplomaDate, e.diplomaDatePrecision),
        [F.school.city]: e.city,
        [F.school.country]: e.country,
      }
    case 'professional_experience':
      return {
        ...base,
        [F.professional_experience.position]: opt(jobTitles, e.jobTitleId),
        [F.professional_experience.otherPosition]: e.otherJobTitle || null,
        [F.professional_experience.company]: org(e.facility),
        [F.professional_experience.companyGerman]: e.facility?.germanValue ?? null,
        [F.professional_experience.facilityType]: e.facilityTypeId === 'other' ? `Other: ${e.otherFacilityType}` : opt(facilityTypes, e.facilityTypeId),
        [F.professional_experience.beds]: e.bedCountUnknown ? null : opt(bedCountOptions, e.bedCountId) || null,
        [F.professional_experience.department]: e.departmentId === 'other' ? `Other: ${e.otherDepartment}` : opt(departments, e.departmentId),
        [F.professional_experience.startDate]: date(e.startDate, e.startDatePrecision),
        [F.professional_experience.endDate]: end,
        [F.professional_experience.employment]: opt(employmentRelationships, e.employmentRelationshipId),
        [F.professional_experience.city]: e.city,
        [F.professional_experience.country]: e.country,
        [F.professional_experience.tasks]: many(tasks, e.taskIds),
        [F.professional_experience.otherTasks]: e.additionalTasks || null,
        [F.professional_experience.additionalInfo]: e.additionalInfo || null,
        [F.professional_experience.conditions]: [...many(conditions, e.conditionIds), ...(e.otherConditions ? [e.otherConditions] : [])],
        [F.professional_experience.equipment]: [...many(equipment, e.equipmentIds), ...(e.otherEquipment ? [e.otherEquipment] : [])],
      }
    case 'career_break':
      return {
        ...base,
        [F.career_break.type]: e.breakTypeId === 'other' ? `Other: ${e.otherBreakType}` : opt(careerBreakTypes, e.breakTypeId),
        [F.career_break.startDate]: date(e.startDate, e.startDatePrecision),
        [F.career_break.endDate]: end,
        [F.career_break.city]: e.city,
        [F.career_break.country]: e.country,
      }
    case 'volunteering':
      return {
        ...base,
        [F.volunteering.purpose]: e.purpose,
        [F.volunteering.startDate]: date(e.startDate, e.startDatePrecision),
        [F.volunteering.endDate]: end,
        [F.volunteering.city]: e.city,
        [F.volunteering.country]: e.country,
      }
  }
}

export function exportCandidate(doc: CandidateDoc, entries: TimelineEntry[]) {
  return {
    candidate: { name: doc.fullName, id: doc.id },
    exportedAt: new Date().toISOString(),
    records: entries
      .filter((e) => e.status !== 'draft')
      .sort((a, b) => (earliestDay(a.startDate) ?? 0) - (earliestDay(b.startDate) ?? 0))
      .map(toTargetRecord),
  }
}
