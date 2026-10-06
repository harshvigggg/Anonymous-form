import type { CatalogOption } from './types'

export interface TaskOption extends CatalogOption {
  group: 'basic' | 'clinical' | 'intensive' | 'theatre' | 'mother_child' | 'specialist' | 'organisation'
}

export const taskGroups: Record<TaskOption['group'], string> = {
  basic: 'Basic care',
  clinical: 'Clinical procedures',
  intensive: 'Intensive care',
  theatre: 'Operation theatre',
  mother_child: 'Mother & child',
  specialist: 'Specialist care',
  organisation: 'Organisation',
}

const task = (id: string, label: string, group: TaskOption['group']): TaskOption => ({ id, label, target: label, group })

/** Target field: "Tasks" (multi-select, target limit 15). */
export const tasks: TaskOption[] = [
  task('medication', 'Administering medication as prescribed', 'basic'),
  task('vitals', 'Monitoring vital signs', 'basic'),
  task('admission_discharge', 'Patient admission and discharge', 'basic'),
  task('wound_care', 'Wound care / dressing changes', 'basic'),
  task('glucose', 'Blood glucose monitoring', 'basic'),
  task('iv_care', 'IV / infusion care', 'basic'),
  task('documentation', 'Nursing documentation', 'basic'),
  task('hygiene', 'Patient hygiene and basic care', 'basic'),
  task('mobilisation', 'Mobilisation', 'basic'),
  task('patient_education', 'Patient and family education', 'basic'),
  task('positioning', 'Bed making and patient positioning', 'basic'),
  task('pressure_ulcer', 'Pressure ulcer prevention', 'basic'),
  task('fall_prevention', 'Fall prevention', 'basic'),
  task('feeding', 'Feeding support', 'basic'),
  task('infection_control', 'Infection control and hand hygiene', 'basic'),

  task('injections', 'Giving injections (IM, SC, ID)', 'clinical'),
  task('cannulation', 'IV cannulation', 'clinical'),
  task('blood_samples', 'Collecting blood and other samples', 'clinical'),
  task('catheter', 'Urinary catheter insertion and care', 'clinical'),
  task('ng_tube', 'Nasogastric tube insertion and feeding', 'clinical'),
  task('oxygen', 'Oxygen therapy', 'clinical'),
  task('nebulisation', 'Nebulisation', 'clinical'),
  task('ecg', 'Recording ECG', 'clinical'),
  task('blood_transfusion', 'Blood transfusion monitoring', 'clinical'),
  task('pre_op', 'Pre-operative preparation', 'clinical'),
  task('post_op', 'Post-operative care', 'clinical'),
  task('doctor_rounds', 'Assisting doctors during rounds', 'clinical'),
  task('cpr', 'CPR / basic life support', 'clinical'),
  task('triage', 'Emergency triage', 'clinical'),

  task('ventilator_care', 'Care of ventilated patients', 'intensive'),
  task('central_line', 'Central line care', 'intensive'),
  task('arterial_line', 'Arterial line monitoring', 'intensive'),
  task('abg', 'Arterial blood gas sampling', 'intensive'),
  task('suctioning', 'Endotracheal / tracheostomy suctioning', 'intensive'),
  task('haemodynamic', 'Haemodynamic monitoring', 'intensive'),
  task('sedation', 'Sedation and pain monitoring', 'intensive'),
  task('cardiac_monitoring', 'Cardiac monitoring', 'intensive'),
  task('neuro_obs', 'Neurological observation (GCS)', 'intensive'),
  task('acls', 'Advanced life support (ACLS)', 'intensive'),

  task('scrub', 'Scrub nurse duties', 'theatre'),
  task('circulating', 'Circulating nurse duties', 'theatre'),
  task('instrument_count', 'Instrument and swab count', 'theatre'),
  task('sterilisation', 'Sterilisation of instruments', 'theatre'),
  task('anaesthesia_assist', 'Assisting anaesthesia', 'theatre'),
  task('recovery', 'Recovery room care', 'theatre'),
  task('ot_preparation', 'Preparing the operation theatre', 'theatre'),

  task('newborn_care', 'Newborn care', 'mother_child'),
  task('phototherapy', 'Phototherapy care', 'mother_child'),
  task('incubator', 'Incubator / warmer care', 'mother_child'),
  task('kangaroo', 'Kangaroo mother care support', 'mother_child'),
  task('breastfeeding', 'Breastfeeding support', 'mother_child'),
  task('paed_dosage', 'Paediatric medication dosage calculation', 'mother_child'),
  task('growth', 'Growth monitoring', 'mother_child'),
  task('vaccination', 'Vaccination / immunisation', 'mother_child'),
  task('antenatal', 'Antenatal check-ups', 'mother_child'),
  task('labour', 'Labour monitoring (partograph)', 'mother_child'),
  task('delivery_assist', 'Assisting normal delivery', 'mother_child'),
  task('postnatal', 'Postnatal care', 'mother_child'),

  task('dialysis', 'Dialysis monitoring', 'specialist'),
  task('chemotherapy', 'Chemotherapy administration support', 'specialist'),
  task('palliative', 'Palliative care', 'specialist'),
  task('dementia', 'Dementia care', 'specialist'),
  task('elderly_daily', 'Helping elderly patients with daily activities', 'specialist'),
  task('mental_state', 'Mental state observation', 'specialist'),
  task('psych_meds', 'Psychiatric medication monitoring', 'specialist'),
  task('rehab_exercises', 'Rehabilitation exercise support', 'specialist'),
  task('cast_traction', 'Cast and traction care', 'specialist'),
  task('stroke_care', 'Stroke patient care', 'specialist'),
  task('home_visits', 'Home visits', 'specialist'),
  task('physio_assessment', 'Physiotherapy assessment', 'specialist'),
  task('physio_treatment', 'Physiotherapy exercises and treatment', 'specialist'),

  task('handover', 'Shift handover reporting', 'organisation'),
  task('supervision', 'Supervising junior staff / students', 'organisation'),
  task('stock', 'Managing ward stock and medicines', 'organisation'),
]

/** Shown first when no department-specific list exists. */
export const defaultPriorityTasks = [
  'medication', 'vitals', 'admission_discharge', 'wound_care', 'glucose',
  'iv_care', 'documentation', 'hygiene', 'mobilisation', 'patient_education',
]
