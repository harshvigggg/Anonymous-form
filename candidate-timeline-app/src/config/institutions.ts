/**
 * Verified institution / school master.
 * Every name maps many spellings (aliases) to one verified record,
 * so the candidate never has to type – or translate – it correctly.
 * Sample data: replace or extend with your own verified list.
 */
export type OrgKind = 'institution' | 'school' | 'facility'

export interface MasterOrg {
  id: string
  kind: OrgKind
  normalizedName: string
  /** German name used in the target record. null → generated, then checked by an executive. */
  germanName: string | null
  city: string
  cityId: string | null
  state?: string
  country: string
  aliases: string[]
  verificationStatus: 'verified' | 'needs_review'
  /** Healthcare facilities only */
  facilityType?: string | null
  bedCountId?: string | null
}

const inst = (
  id: string,
  normalizedName: string,
  city: string,
  cityId: string,
  state: string,
  aliases: string[],
): MasterOrg => ({
  id,
  kind: 'institution',
  normalizedName,
  germanName: normalizedName,
  city,
  cityId,
  state,
  country: 'India',
  aliases,
  verificationStatus: 'verified',
})

export const institutions: MasterOrg[] = [
  inst('inst-oxford-nursing-blr', 'The Oxford Nursing School', 'Bengaluru', 'in-bengaluru', 'Karnataka', ['Oxford Nursing School', 'Oxford School of Nursing', 'Oxford Nursing']),
  inst('inst-cmc-vellore-con', 'College of Nursing, Christian Medical College', 'Vellore', 'in-vellore', 'Tamil Nadu', ['CMC Vellore College of Nursing', 'CMC College of Nursing', 'Christian Medical College Nursing']),
  inst('inst-aiims-delhi-con', 'College of Nursing, AIIMS New Delhi', 'New Delhi', 'in-new-delhi', 'Delhi', ['AIIMS College of Nursing', 'All India Institute of Medical Sciences College of Nursing']),
  inst('inst-rak-delhi', 'Rajkumari Amrit Kaur College of Nursing', 'New Delhi', 'in-new-delhi', 'Delhi', ['RAK College of Nursing', 'Raj Kumari Amrit Kaur College of Nursing']),
  inst('inst-nine-pgimer', 'National Institute of Nursing Education, PGIMER', 'Chandigarh', 'in-chandigarh', 'Chandigarh', ['NINE PGIMER', 'PGI Nursing College Chandigarh']),
  inst('inst-gcn-tvm', 'Government College of Nursing, Thiruvananthapuram', 'Thiruvananthapuram', 'in-thiruvananthapuram', 'Kerala', ['Govt College of Nursing Trivandrum', 'GCN Trivandrum']),
  inst('inst-gcn-kozhikode', 'Government College of Nursing, Kozhikode', 'Kozhikode', 'in-kozhikode', 'Kerala', ['Govt College of Nursing Calicut', 'GCN Calicut']),
  inst('inst-gcn-kottayam', 'Government College of Nursing, Kottayam', 'Kottayam', 'in-kottayam', 'Kerala', ['Govt College of Nursing Kottayam']),
  inst('inst-mmc-chennai-con', 'College of Nursing, Madras Medical College', 'Chennai', 'in-chennai', 'Tamil Nadu', ['MMC College of Nursing', 'Madras Medical College Nursing']),
  inst('inst-manipal-con', 'Manipal College of Nursing', 'Manipal', 'in-manipal', 'Karnataka', ['MCON Manipal', 'Manipal Nursing College']),
  inst('inst-afmc-con', 'College of Nursing, Armed Forces Medical College', 'Pune', 'in-pune', 'Maharashtra', ['AFMC College of Nursing', 'AFMC Nursing']),
  inst('inst-srm-faculty-nursing', 'Sri Ramachandra Faculty of Nursing', 'Chennai', 'in-chennai', 'Tamil Nadu', ['Sri Ramachandra College of Nursing']),
  inst('inst-amrita-con', 'Amrita College of Nursing', 'Kochi', 'in-kochi', 'Kerala', ['Amrita Nursing College']),
  inst('inst-apollo-con', 'Apollo College of Nursing', 'Chennai', 'in-chennai', 'Tamil Nadu', ['Apollo Nursing College']),
  inst('inst-rufaida', 'Rufaida College of Nursing, Jamia Hamdard', 'New Delhi', 'in-new-delhi', 'Delhi', ['Rufaida College of Nursing', 'Jamia Hamdard Nursing']),
  inst('inst-bv-pune-con', 'Bharati Vidyapeeth College of Nursing', 'Pune', 'in-pune', 'Maharashtra', ['Bharati Vidyapeeth Nursing College']),
]

export const schools: MasterOrg[] = [
  {
    id: 'school-kv2-kanchrapara',
    kind: 'school',
    normalizedName: 'Kendriya Vidyalaya No. 2',
    germanName: 'Kendriya Vidyalaya No. 2',
    city: 'Kanchrapara',
    cityId: 'in-kanchrapara',
    state: 'West Bengal',
    country: 'India',
    aliases: ['KV No 2 Kanchrapara', 'Kendriya Vidyalaya 2', 'KV 2'],
    verificationStatus: 'verified',
  },
]
