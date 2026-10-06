import type { CatalogOption } from './types'

export interface EmploymentRelationship extends CatalogOption {
  /** Shown first; the rest appear behind "Other". */
  common: boolean
}

/** Target field: "Employment relationship". */
export const employmentRelationships: EmploymentRelationship[] = [
  { id: 'full_time', label: 'Full-time', target: 'Full-time', common: true },
  { id: 'part_time', label: 'Part-time', target: 'Part-time', common: true },
  { id: 'internship', label: 'Internship', target: 'Internship', common: true },
  { id: 'apprentice', label: 'Apprentice / Trainee', target: 'Apprenticeship / Trainee', common: false },
  { id: 'freelance', label: 'Freelance', target: 'Freelance', common: false },
  { id: 'self_employed', label: 'Self-employed', target: 'Self-employed', common: false },
  { id: 'voluntary', label: 'Voluntary', target: 'Voluntary', common: false },
  { id: 'voluntary_social_year', label: 'Voluntary Social Year', target: 'Voluntary social year', common: false },
]
