import type { CatalogOption } from './types'

/**
 * Home-country (India) qualification names.
 * Target field: "Name of the Qualification in the Home Country".
 */
export const homeQualificationNames: CatalogOption[] = [
  { id: 'gnm_3y', label: 'Diploma in General Nursing and Midwifery (3 years)', target: 'Diploma in General Nursing and Midwifery (3 years)' },
  { id: 'bsc_4y', label: 'Bachelor of Science in Nursing – B.Sc (N) (4 years)', target: 'Bachelor of Science in Nursing (4 years)' },
  { id: 'pbbsc_2y', label: 'Post Basic B.Sc Nursing (2 years)', target: 'Post Basic Bachelor of Science in Nursing (2 years)' },
  { id: 'anm_2y', label: 'Auxiliary Nurse Midwifery – ANM (2 years)', target: 'Auxiliary Nurse Midwifery (2 years)' },
  { id: 'anm_18m', label: 'Auxiliary Nurse Midwifery – ANM (18 months)', target: 'Auxiliary Nurse Midwifery (18 months)' },
  { id: 'msc_2y', label: 'Master of Science in Nursing – M.Sc (N) (2 years)', target: 'Master of Science in Nursing (2 years)' },
  { id: 'other', label: 'A different name', target: 'Other', requiresText: true },
]

export interface TrainingQualification extends CatalogOption {
  /** Home-country names this qualification maps to. Exactly one → auto-selected. */
  homeNames: string[]
  /** Set by the system when the mapping is known. */
  recognitionEligibility: 'eligible' | 'unknown'
  /** The mapping needs an executive check. */
  mappingUncertain?: boolean
}

/**
 * Candidate-friendly list for "Nursing / College Education".
 * Target field: "Degree".
 */
export const trainingQualifications: TrainingQualification[] = [
  {
    id: 'gnm',
    short: "GNM Nursing",
    label: 'GNM – General Nursing and Midwifery',
    description: 'Diploma, usually 3 years',
    target: 'Diploma (nursing training)',
    homeNames: ['gnm_3y'],
    recognitionEligibility: 'eligible',
  },
  {
    id: 'bsc',
    short: "B.Sc Nursing",
    label: 'B.Sc Nursing',
    description: 'Bachelor degree, 4 years',
    target: "Bachelor's degree",
    homeNames: ['bsc_4y'],
    recognitionEligibility: 'eligible',
  },
  {
    id: 'pbbsc',
    short: "Post Basic B.Sc Nursing",
    label: 'Post Basic B.Sc Nursing',
    description: 'Bachelor degree after GNM, 2 years',
    target: "Bachelor's degree",
    homeNames: ['pbbsc_2y'],
    recognitionEligibility: 'eligible',
  },
  {
    id: 'anm',
    short: "ANM",
    label: 'ANM – Auxiliary Nurse Midwife',
    description: 'Diploma, 18 months or 2 years',
    target: 'Diploma (nursing training)',
    homeNames: ['anm_2y', 'anm_18m'],
    recognitionEligibility: 'eligible',
  },
  {
    id: 'msc',
    short: "M.Sc Nursing",
    label: 'M.Sc Nursing',
    description: 'Master degree, 2 years',
    target: "Master's degree",
    homeNames: ['msc_2y'],
    recognitionEligibility: 'eligible',
  },
  {
    id: 'other_nursing_diploma',
    short: "Nursing Diploma",
    label: 'Other Nursing Diploma',
    target: 'Diploma (nursing training)',
    homeNames: [],
    recognitionEligibility: 'unknown',
    mappingUncertain: true,
  },
  {
    id: 'other_bachelor',
    short: "Bachelor's Degree",
    label: "Other Bachelor's Degree",
    target: "Bachelor's degree",
    homeNames: [],
    recognitionEligibility: 'unknown',
    mappingUncertain: true,
  },
  {
    id: 'other',
    label: 'Other',
    target: 'Other',
    requiresText: true,
    homeNames: [],
    recognitionEligibility: 'unknown',
    mappingUncertain: true,
  },
]

/**
 * Candidate-friendly list for "School Education".
 * Target section: General School Leaving Certificate.
 */
export const schoolQualifications: CatalogOption[] = [
  {
    id: 'class10',
    short: "Class 10",
    label: 'Class 10 / Secondary School',
    description: 'Matriculation, SSC, SSLC',
    target: 'Secondary School Certificate (Class 10)',
  },
  {
    id: 'class12',
    short: "Class 12",
    label: 'Class 12 / Higher Secondary',
    description: 'Used as your General School Leaving Certificate',
    target: 'Higher Secondary Certificate (Class 12)',
  },
  {
    id: 'senior_secondary',
    short: "Senior Secondary",
    label: 'Senior Secondary',
    description: 'Also used as your General School Leaving Certificate',
    target: 'Senior Secondary Certificate',
  },
  {
    id: 'other_school',
    label: 'Other School Qualification',
    target: 'Other school qualification',
    requiresText: true,
  },
]
