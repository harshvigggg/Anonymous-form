import { institutions, schools, type MasterOrg, type OrgKind } from '@/config/institutions'
import { healthcareFacilities } from '@/config/healthcareFacilities'
import type { OrgName } from '@/domain/timeline/types'
import { matchScore, normalizeName, searchKey } from './text'

export function staticMaster(kind: OrgKind): MasterOrg[] {
  if (kind === 'facility') return healthcareFacilities
  if (kind === 'school') return schools
  return institutions
}

export interface OrgMatch {
  org: MasterOrg
  score: number
}

/** Search the verified master (plus any executive-approved additions) for a typed name. */
export function searchOrgs(query: string, kind: OrgKind, additions: MasterOrg[] = [], limit = 5): OrgMatch[] {
  if (searchKey(query).length < 2) return []
  const pool = [...staticMaster(kind), ...additions.filter((a) => a.kind === kind)]
  const seen = new Set<string>()
  return pool
    .map((org) => {
      const names = [org.normalizedName, ...org.aliases, `${org.normalizedName} ${org.city}`]
      return { org, score: Math.max(...names.map((n) => matchScore(query, n))) }
    })
    .filter((m) => m.score > 0 && !seen.has(m.org.id) && seen.add(m.org.id))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

/** Best verified match for a value the candidate typed manually – shown to executives as "Suggested". */
export function suggestOrg(raw: string, kind: OrgKind, additions: MasterOrg[] = []): MasterOrg | null {
  const [best] = searchOrgs(raw, kind, additions, 1)
  return best && best.score >= 0.75 ? best.org : null
}

/**
 * German name for the target record. Proper names are kept as they are; the
 * result is marked "generated" so an executive confirms it once.
 */
export function generateGermanName(normalized: string): string {
  return normalized
}

export function orgFromMaster(org: MasterOrg, typed: string): OrgName {
  return {
    rawValue: typed || org.normalizedName,
    normalizedValue: org.normalizedName,
    germanValue: org.germanName ?? generateGermanName(org.normalizedName),
    germanStatus: org.germanName ? 'verified' : 'generated',
    verifiedValue: org.verificationStatus === 'verified' ? org.normalizedName : null,
    masterId: org.id,
    source: 'master',
    verificationStatus: org.verificationStatus,
  }
}

export function orgFromCandidate(raw: string): OrgName {
  const normalized = normalizeName(raw)
  return {
    rawValue: raw,
    normalizedValue: normalized,
    germanValue: generateGermanName(normalized),
    germanStatus: 'generated',
    verifiedValue: null,
    masterId: null,
    source: 'candidate',
    verificationStatus: 'needs_review',
  }
}

export function displayOrg(org: OrgName | null | undefined): string {
  if (!org) return ''
  return org.verifiedValue || org.normalizedValue || org.rawValue
}
