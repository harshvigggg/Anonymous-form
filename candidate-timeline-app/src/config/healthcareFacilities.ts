import type { MasterOrg } from './institutions'

/**
 * Verified healthcare facility master.
 * Bed counts are left empty unless verified – never guessed.
 * Sample data: replace or extend with your own verified list.
 */
const fac = (
  id: string,
  normalizedName: string,
  city: string,
  cityId: string,
  state: string,
  aliases: string[],
  facilityType = 'hospital',
): MasterOrg => ({
  id,
  kind: 'facility',
  normalizedName,
  germanName: normalizedName,
  city,
  cityId,
  state,
  country: 'India',
  aliases,
  verificationStatus: 'verified',
  facilityType,
  bedCountId: null,
})

export const healthcareFacilities: MasterOrg[] = [
  fac('fac-gupta-nh-moradabad', 'Gupta Nursing Home', 'Moradabad', 'in-moradabad', 'Uttar Pradesh', ['Gupta Nursing Hom', 'Gupta Hospital Moradabad'], 'nursing_home'),
  fac('fac-aiims-delhi', 'All India Institute of Medical Sciences (AIIMS)', 'New Delhi', 'in-new-delhi', 'Delhi', ['AIIMS', 'AIIMS Delhi', 'AIIMS New Delhi']),
  fac('fac-cmc-vellore', 'Christian Medical College Hospital', 'Vellore', 'in-vellore', 'Tamil Nadu', ['CMC Vellore', 'CMC Hospital']),
  fac('fac-pgimer', 'Postgraduate Institute of Medical Education and Research (PGIMER)', 'Chandigarh', 'in-chandigarh', 'Chandigarh', ['PGI Chandigarh', 'PGIMER']),
  fac('fac-safdarjung', 'Safdarjung Hospital', 'New Delhi', 'in-new-delhi', 'Delhi', ['Safdarjang Hospital', 'VMMC Safdarjung']),
  fac('fac-sgrh', 'Sir Ganga Ram Hospital', 'New Delhi', 'in-new-delhi', 'Delhi', ['Ganga Ram Hospital', 'SGRH']),
  fac('fac-kem-mumbai', 'King Edward Memorial Hospital (KEM)', 'Mumbai', 'in-mumbai', 'Maharashtra', ['KEM Hospital', 'KEM Mumbai']),
  fac('fac-kokilaben', 'Kokilaben Dhirubhai Ambani Hospital', 'Mumbai', 'in-mumbai', 'Maharashtra', ['Kokilaben Hospital']),
  fac('fac-apollo-greams', 'Apollo Hospitals, Greams Road', 'Chennai', 'in-chennai', 'Tamil Nadu', ['Apollo Chennai', 'Apollo Greams Road', 'Apollo Hospital']),
  fac('fac-rggh-chennai', 'Rajiv Gandhi Government General Hospital', 'Chennai', 'in-chennai', 'Tamil Nadu', ['Government General Hospital Chennai', 'GH Chennai', 'RGGGH']),
  fac('fac-narayana-blr', 'Narayana Health City', 'Bengaluru', 'in-bengaluru', 'Karnataka', ['Narayana Hrudayalaya', 'Narayana Health']),
  fac('fac-manipal-blr', 'Manipal Hospital, Old Airport Road', 'Bengaluru', 'in-bengaluru', 'Karnataka', ['Manipal Hospital Bangalore', 'Manipal Hospital']),
  fac('fac-medanta', 'Medanta – The Medicity', 'Gurugram', 'in-gurugram', 'Haryana', ['Medanta', 'Medanta Gurgaon']),
  fac('fac-amrita-kochi', 'Amrita Institute of Medical Sciences', 'Kochi', 'in-kochi', 'Kerala', ['AIMS Kochi', 'Amrita Hospital Kochi', 'Amrita Hospital']),
  fac('fac-aster-medcity', 'Aster Medcity', 'Kochi', 'in-kochi', 'Kerala', ['Aster Medcity Kochi', 'Aster Hospital Kochi']),
  fac('fac-mch-tvm', 'Government Medical College Hospital, Thiruvananthapuram', 'Thiruvananthapuram', 'in-thiruvananthapuram', 'Kerala', ['Medical College Hospital Trivandrum', 'Trivandrum Medical College']),
  fac('fac-sskm', 'SSKM Hospital (IPGME&R)', 'Kolkata', 'in-kolkata', 'West Bengal', ['SSKM', 'PG Hospital Kolkata', 'IPGMER']),
  fac('fac-kgmu', "King George's Medical University Hospital (KGMU)", 'Lucknow', 'in-lucknow', 'Uttar Pradesh', ['KGMU', 'KGMC Lucknow', 'Medical College Lucknow']),
  fac('fac-nims', "Nizam's Institute of Medical Sciences (NIMS)", 'Hyderabad', 'in-hyderabad', 'Telangana', ['NIMS Hyderabad', 'NIMS']),
  fac('fac-ruby-hall', 'Ruby Hall Clinic', 'Pune', 'in-pune', 'Maharashtra', ['Ruby Hall', 'Ruby Hall Pune']),
]
