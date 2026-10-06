import type { CatalogOption } from './types'

const e = (id: string, label: string): CatalogOption => ({ id, label, target: label })

/** Target field: "Equipment used". Required for intensive / theatre departments. */
export const equipment: CatalogOption[] = [
  e('cardiac_monitor', 'Cardiac monitor'),
  e('pulse_oximeter', 'Pulse oximeter'),
  e('infusion_pump', 'Infusion pump'),
  e('ventilator', 'Ventilator'),
  e('oxygen_mask', 'Oxygen mask'),
  e('nasal_cannula', 'Nasal cannula'),
  e('glucometer', 'Glucometer'),
  e('suction', 'Suction machine'),
  e('defibrillator', 'Defibrillator'),
  e('syringe_pump', 'Syringe pump'),
  e('ecg_machine', 'ECG machine'),
  e('cpap_bipap', 'CPAP / BiPAP'),
  e('high_flow', 'High-flow oxygen'),
  e('ambu_bag', 'Ambu bag'),
  e('abg_analyser', 'Blood gas analyser'),
  e('central_line_kit', 'Central line / CVP set'),
  e('feeding_pump', 'Feeding pump'),
  e('incubator', 'Incubator'),
  e('radiant_warmer', 'Radiant warmer'),
  e('phototherapy', 'Phototherapy unit'),
  e('anaesthesia_machine', 'Anaesthesia machine'),
  e('cautery', 'Electrosurgical unit (cautery)'),
  e('ot_table', 'Operating table'),
  e('surgical_instruments', 'Surgical instrument sets'),
  e('autoclave', 'Autoclave / steriliser'),
  e('laparoscopy_tower', 'Laparoscopy tower'),
  e('patient_warmer', 'Patient warming system'),
  e('other', 'Other'),
]
