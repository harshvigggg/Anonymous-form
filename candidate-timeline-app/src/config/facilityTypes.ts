import type { CatalogOption } from './types'

export interface FacilityType extends CatalogOption {
  /** Inpatient facilities are asked for their bed count. */
  inpatient: boolean
}

/** Target field: "Facility type". */
export const facilityTypes: FacilityType[] = [
  { id: 'hospital', label: 'Hospital', icon: '🏥', target: 'Hospital', inpatient: true },
  { id: 'nursing_home', label: 'Nursing Home / Care Home', icon: '🏠', target: 'Nursing home', inpatient: true },
  { id: 'outpatient', label: 'Outpatient / Home Care', icon: '🚑', target: 'Outpatient care service', inpatient: false },
  { id: 'rehab', label: 'Rehabilitation Clinic', icon: '♿', target: 'Rehabilitation clinic', inpatient: true },
  { id: 'clinic', label: 'Clinic / Medical Centre', icon: '🩺', target: 'Other', inpatient: false },
  { id: 'other', label: 'Other', icon: '🏢', target: 'Other', inpatient: false, requiresText: true },
]

/** Target field: "Number of beds". "I don't know" is handled separately (value = null + warning). */
export const bedCountOptions: CatalogOption[] = [
  { id: 'lt50', label: 'Up to 50 beds', target: 'up to 50' },
  { id: '51_100', label: '51 – 100 beds', target: '51-100' },
  { id: '101_250', label: '101 – 250 beds', target: '101-250' },
  { id: '251_500', label: '251 – 500 beds', target: '251-500' },
  { id: '501_1000', label: '501 – 1,000 beds', target: '501-1000' },
  { id: 'gt1000', label: 'More than 1,000 beds', target: 'more than 1000' },
]

export function isInpatient(facilityTypeId: string | null | undefined): boolean {
  return !!facilityTypes.find((f) => f.id === facilityTypeId)?.inpatient
}
