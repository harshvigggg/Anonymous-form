import type { CatalogOption } from './types'
import { defaultPriorityTasks } from './tasks'

export interface Department extends CatalogOption {
  /** Conditional-field rules live here, never in page code. */
  requiresConditions?: boolean
  requiresEquipment?: boolean
  /** Tasks shown first for this department (rest behind "Show more tasks"). */
  priorityTasks?: string[]
  priorityConditions?: string[]
  priorityEquipment?: string[]
}

const icuTasks = ['ventilator_care', 'haemodynamic', 'central_line', 'arterial_line', 'abg', 'suctioning', 'medication', 'iv_care', 'sedation', 'documentation']
const icuConditions = ['sepsis', 'resp_failure', 'cardiac_arrest', 'mi', 'stroke', 'polytrauma', 'head_injury', 'post_op_major', 'kidney_failure', 'poisoning']
const icuEquipment = ['ventilator', 'cardiac_monitor', 'infusion_pump', 'syringe_pump', 'defibrillator', 'suction', 'pulse_oximeter', 'abg_analyser', 'cpap_bipap', 'central_line_kit']

/** Target field: "Department". No free text unless "Other" is selected. */
export const departments: Department[] = [
  { id: 'general_medicine', label: 'General Medicine', target: 'General medicine' },
  { id: 'internal_medicine', label: 'Internal Medicine', target: 'Internal medicine' },
  {
    id: 'general_surgery', label: 'General Surgery', target: 'General surgery',
    priorityTasks: ['pre_op', 'post_op', 'wound_care', 'medication', 'vitals', 'iv_care', 'catheter', 'ng_tube', 'mobilisation', 'documentation'],
  },
  {
    id: 'icu', label: 'ICU', description: 'Intensive Care Unit', target: 'Intensive care unit (ICU)',
    requiresConditions: true, requiresEquipment: true,
    priorityTasks: icuTasks, priorityConditions: icuConditions, priorityEquipment: icuEquipment,
  },
  {
    id: 'ccu', label: 'CCU / Cardiac ICU', description: 'Cardiac intensive care', target: 'Cardiac intensive care unit (CCU)',
    requiresConditions: true, requiresEquipment: true,
    priorityTasks: ['cardiac_monitoring', 'ecg', 'haemodynamic', 'medication', 'iv_care', 'acls', 'arterial_line', 'vitals', 'oxygen', 'documentation'],
    priorityConditions: ['mi', 'heart_failure', 'arrhythmia', 'cardiac_arrest', 'cardiac_surgery'],
    priorityEquipment: ['cardiac_monitor', 'ecg_machine', 'defibrillator', 'infusion_pump', 'syringe_pump', 'pulse_oximeter', 'ventilator'],
  },
  {
    id: 'nicu', label: 'NICU', description: 'Newborn Intensive Care', target: 'Neonatal intensive care unit (NICU)',
    requiresConditions: true, requiresEquipment: true,
    priorityTasks: ['newborn_care', 'incubator', 'phototherapy', 'kangaroo', 'paed_dosage', 'feeding', 'vitals', 'iv_care', 'suctioning', 'documentation'],
    priorityConditions: ['premature', 'low_birth_weight', 'neonatal_jaundice', 'neonatal_rds', 'neonatal_sepsis', 'birth_asphyxia', 'congenital'],
    priorityEquipment: ['incubator', 'radiant_warmer', 'phototherapy', 'cpap_bipap', 'ventilator', 'pulse_oximeter', 'syringe_pump', 'infusion_pump', 'suction', 'cardiac_monitor'],
  },
  {
    id: 'picu', label: 'PICU', description: 'Children Intensive Care', target: 'Paediatric intensive care unit (PICU)',
    requiresConditions: true, requiresEquipment: true,
    priorityTasks: ['paed_dosage', 'vitals', 'iv_care', 'ventilator_care', 'suctioning', 'medication', 'oxygen', 'nebulisation', 'haemodynamic', 'documentation'],
    priorityConditions: ['paed_respiratory', 'paed_seizures', 'sepsis', 'dengue_malaria', 'dehydration', 'pneumonia', 'head_injury', 'poisoning', 'snake_bite'],
    priorityEquipment: ['ventilator', 'cardiac_monitor', 'pulse_oximeter', 'syringe_pump', 'infusion_pump', 'cpap_bipap', 'suction', 'defibrillator'],
  },
  {
    id: 'emergency', label: 'Emergency Department', target: 'Emergency department',
    priorityTasks: ['triage', 'cpr', 'vitals', 'cannulation', 'medication', 'ecg', 'wound_care', 'oxygen', 'blood_samples', 'documentation'],
  },
  {
    id: 'operating_theatre', label: 'Operating Theatre', description: 'OT', target: 'Operating theatre',
    requiresConditions: true, requiresEquipment: true,
    priorityTasks: ['scrub', 'circulating', 'instrument_count', 'sterilisation', 'anaesthesia_assist', 'ot_preparation', 'recovery', 'pre_op', 'post_op', 'documentation'],
    priorityConditions: ['general_surgery', 'orthopaedic_surgery', 'caesarean', 'gynae_surgery', 'laparoscopic', 'cardiac_surgery', 'neuro_surgery', 'ent_eye_surgery', 'urology_surgery'],
    priorityEquipment: ['anaesthesia_machine', 'cautery', 'ot_table', 'surgical_instruments', 'autoclave', 'cardiac_monitor', 'pulse_oximeter', 'suction', 'laparoscopy_tower', 'patient_warmer'],
  },
  {
    id: 'orthopaedics', label: 'Orthopaedics', target: 'Orthopaedics',
    priorityTasks: ['cast_traction', 'mobilisation', 'post_op', 'pre_op', 'wound_care', 'medication', 'vitals', 'pressure_ulcer', 'fall_prevention', 'documentation'],
  },
  {
    id: 'cardiology', label: 'Cardiology', target: 'Cardiology',
    priorityTasks: ['cardiac_monitoring', 'ecg', 'medication', 'vitals', 'iv_care', 'blood_samples', 'patient_education', 'oxygen', 'admission_discharge', 'documentation'],
  },
  {
    id: 'paediatrics', label: 'Paediatrics', target: 'Paediatrics',
    priorityTasks: ['paed_dosage', 'vitals', 'vaccination', 'growth', 'nebulisation', 'iv_care', 'medication', 'feeding', 'patient_education', 'documentation'],
  },
  {
    id: 'obgyn', label: 'Gynaecology / Obstetrics', description: 'Including labour room', target: 'Gynaecology and obstetrics',
    priorityTasks: ['antenatal', 'labour', 'delivery_assist', 'postnatal', 'newborn_care', 'breastfeeding', 'medication', 'vitals', 'catheter', 'documentation'],
  },
  {
    id: 'nephrology', label: 'Dialysis / Nephrology', target: 'Nephrology / dialysis',
    priorityTasks: ['dialysis', 'vitals', 'medication', 'blood_samples', 'iv_care', 'infection_control', 'patient_education', 'glucose', 'documentation', 'admission_discharge'],
  },
  {
    id: 'oncology', label: 'Oncology', description: 'Cancer care', target: 'Oncology',
    priorityTasks: ['chemotherapy', 'palliative', 'iv_care', 'medication', 'blood_transfusion', 'vitals', 'infection_control', 'patient_education', 'central_line', 'documentation'],
  },
  {
    id: 'neurology', label: 'Neurology', target: 'Neurology',
    priorityTasks: ['neuro_obs', 'stroke_care', 'mobilisation', 'medication', 'vitals', 'ng_tube', 'pressure_ulcer', 'fall_prevention', 'hygiene', 'documentation'],
  },
  {
    id: 'psychiatry', label: 'Psychiatry', target: 'Psychiatry',
    priorityTasks: ['mental_state', 'psych_meds', 'medication', 'patient_education', 'hygiene', 'vitals', 'documentation', 'handover', 'admission_discharge', 'feeding'],
  },
  {
    id: 'geriatrics', label: 'Geriatric Care', description: 'Elderly care', target: 'Geriatrics',
    priorityTasks: ['elderly_daily', 'dementia', 'hygiene', 'mobilisation', 'fall_prevention', 'pressure_ulcer', 'medication', 'feeding', 'vitals', 'documentation'],
  },
  {
    id: 'rehabilitation', label: 'Rehabilitation', target: 'Rehabilitation',
    priorityTasks: ['rehab_exercises', 'mobilisation', 'physio_treatment', 'physio_assessment', 'fall_prevention', 'hygiene', 'medication', 'patient_education', 'vitals', 'documentation'],
  },
  { id: 'opd', label: 'Outpatient Department (OPD)', target: 'Outpatient department' },
  {
    id: 'home_care', label: 'Home Care', target: 'Home care',
    priorityTasks: ['home_visits', 'medication', 'vitals', 'wound_care', 'glucose', 'hygiene', 'elderly_daily', 'patient_education', 'injections', 'documentation'],
  },
  { id: 'other', label: 'Other', target: 'Other', requiresText: true },
]

export function getDepartment(id: string | null | undefined): Department | undefined {
  return departments.find((d) => d.id === id)
}

export function requiresConditions(departmentId: string | null | undefined): boolean {
  return !!getDepartment(departmentId)?.requiresConditions
}

export function requiresEquipment(departmentId: string | null | undefined): boolean {
  return !!getDepartment(departmentId)?.requiresEquipment
}

export function priorityTasksFor(departmentId: string | null | undefined): string[] {
  return getDepartment(departmentId)?.priorityTasks ?? defaultPriorityTasks
}
