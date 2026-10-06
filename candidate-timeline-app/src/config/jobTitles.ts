import type { CatalogOption } from './types'

/** Target field: "Position title / job title". The full target catalog can be added here without code changes. */
export const jobTitles: CatalogOption[] = [
  { id: 'staff_nurse', label: 'Registered Nurse / Staff Nurse', short: 'Staff Nurse', target: 'Registered nurse' },
  { id: 'nursing_officer', label: 'Nursing Officer', target: 'Nursing officer' },
  { id: 'nurse_in_training', label: 'Nurse in Training', target: 'Nurse in training' },
  { id: 'nursing_assistant', label: 'Nursing Assistant', target: 'Nursing assistant' },
  { id: 'icu_nurse', label: 'ICU Nurse', target: 'Intensive care nurse' },
  { id: 'ot_nurse', label: 'Operation Theatre Nurse', target: 'Operating room nurse' },
  { id: 'paediatric_nurse', label: 'Paediatric Nurse', target: 'Paediatric nurse' },
  { id: 'midwife', label: 'Midwife', target: 'Midwife' },
  { id: 'physiotherapist', label: 'Physiotherapist', target: 'Physiotherapist' },
  { id: 'other', label: 'Other', target: 'Other', requiresText: true },
]
