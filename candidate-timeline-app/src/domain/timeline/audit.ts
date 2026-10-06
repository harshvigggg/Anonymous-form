import { newId } from '@/lib/ids'
import type { AuditLogEntry, ChangedByType, TimelineEntry } from './types'

export function auditEntry(
  entryId: string | null,
  field: string,
  previousValue: unknown,
  newValue: unknown,
  changedByType: ChangedByType,
  changedById: string,
  changedAt = new Date().toISOString(),
): AuditLogEntry {
  return {
    id: newId(),
    entryId,
    field,
    previousValue: stringify(previousValue),
    newValue: stringify(newValue),
    changedByType,
    changedById,
    changedAt,
  }
}

function stringify(v: unknown): string | null {
  if (v === null || v === undefined || v === '') return null
  if (typeof v === 'string') return v
  if (typeof v === 'object' && v && 'rawValue' in v) {
    const o = v as { rawValue: string; normalizedValue: string }
    return o.normalizedValue || o.rawValue
  }
  return JSON.stringify(v)
}

const IGNORED = new Set(['updatedAt', 'wizardStep', 'status', 'createdAt', 'candidateId', 'id', 'type'])

/** Field-level differences between two versions of the same entry. */
export function diffEntries(before: TimelineEntry, after: TimelineEntry): { field: string; from: unknown; to: unknown }[] {
  const a = before as unknown as Record<string, unknown>
  const b = after as unknown as Record<string, unknown>
  const out: { field: string; from: unknown; to: unknown }[] = []
  for (const key of Object.keys(b)) {
    if (IGNORED.has(key)) continue
    if (JSON.stringify(a[key]) !== JSON.stringify(b[key])) out.push({ field: key, from: a[key], to: b[key] })
  }
  return out
}
