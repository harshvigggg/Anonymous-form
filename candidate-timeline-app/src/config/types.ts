/** A controlled dropdown value. `label` is what the candidate sees, `target` is the exact target-system value. */
export interface CatalogOption {
  id: string
  label: string
  description?: string
  /** Short name for timeline cards */
  short?: string
  icon?: string
  /** Exact value written to the target system. */
  target: string
  /** Selecting this option asks for a short free-text value. */
  requiresText?: boolean
}

export function byId<T extends { id: string }>(list: readonly T[], id: string | null | undefined): T | undefined {
  if (!id) return undefined
  return list.find((o) => o.id === id)
}
