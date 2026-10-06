import type { EntryType } from '@/domain/timeline/types'

/** Section names in the target system. */
export const targetSections: Record<EntryType, string> = {
  training: 'Education › Add Training',
  school: 'Education › General School Leaving Certificate',
  professional_experience: 'Work Experience › Professional Experience',
  career_break: 'Work Experience › Career Break',
  volunteering: 'Work Experience › Volunteering',
}

/** Exact target-system field names, used by the executive export. */
export const targetFieldNames = {
  training: {
    degree: 'Degree',
    otherDegree: 'Other degree',
    homeName: 'Name of the Qualification in the Home Country',
    otherHomeName: 'Other Qualification - Name of Qualification in Home Country',
    institution: 'Name of university, college or training institution (original language)',
    institutionGerman: 'Name of university, college or training institution (German)',
    startDate: 'Start date',
    endDate: 'End date',
    diplomaDate: 'Diploma Date',
    city: 'City',
    country: 'Country',
    recognition: 'Recognition Eligibility in Home Country',
  },
  school: {
    classification: 'Entry classification',
    institution: 'Name of training institution (original language)',
    institutionGerman: 'Name of training institution (German)',
    startDate: 'Start date',
    endDate: 'End date',
    diplomaDate: 'Diploma Date',
    city: 'City',
    country: 'Country',
  },
  professional_experience: {
    position: 'Position title/job title',
    otherPosition: 'Other position',
    company: 'Name of company or hospital (original language)',
    companyGerman: 'Name of company or hospital (German)',
    facilityType: 'Facility type',
    beds: 'Number of beds',
    department: 'Department',
    startDate: 'Start date',
    endDate: 'End date',
    employment: 'Employment relationship',
    city: 'City',
    country: 'Country',
    tasks: 'Tasks',
    otherTasks: 'Additional tasks not included in dropdown',
    additionalInfo: 'Additional information on work experience',
    conditions: 'Conditions treated',
    equipment: 'Equipment used',
  },
  career_break: {
    type: 'Type of career break',
    startDate: 'Start date',
    endDate: 'End date',
    city: 'City',
    country: 'Country',
  },
  volunteering: {
    purpose: 'Social or voluntary purpose',
    startDate: 'Start date',
    endDate: 'End date',
    city: 'City',
    country: 'Country',
  },
} as const
