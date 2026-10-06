'use client'

import { useId, useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import type { MasterOrg, OrgKind } from '@/config/institutions'
import type { OrgName } from '@/domain/timeline/types'
import { displayOrg, orgFromCandidate, orgFromMaster, searchOrgs } from '@/lib/normalization/orgName'
import { normalizeName } from '@/lib/normalization/text'
import { Button, Check } from '@/components/ui'

/**
 * Search the verified list first; fall back to "Add a new …" which keeps the
 * raw text and a normalised version for executive review. The candidate never
 * sees or types a German name.
 */
export function OrgSearch({
  kind,
  value,
  onSelect,
  additions,
  label,
}: {
  kind: OrgKind
  value: OrgName | null
  onSelect: (org: OrgName | null, master: MasterOrg | null) => void
  additions: MasterOrg[]
  label: string
}) {
  const { t } = useI18n()
  const inputId = useId()
  const [query, setQuery] = useState(value ? '' : '')
  const [editing, setEditing] = useState(!value)
  const matches = useMemo(() => searchOrgs(query, kind, additions), [query, kind, additions])

  if (value && !editing) {
    return (
      <div className="rounded-2xl border-2 border-brand bg-brand-soft p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-white"><Check className="h-4 w-4" /></span>
          <div className="flex-1">
            <p className="font-semibold leading-snug">{displayOrg(value)}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2"
          onClick={() => {
            setQuery(value.rawValue)
            setEditing(true)
          }}
        >
          {t('common.change')}
        </Button>
      </div>
    )
  }

  const typed = query.trim()
  const normalized = normalizeName(typed)

  return (
    <div>
      <label htmlFor={inputId} className="sr-only">{label}</label>
      <input
        id={inputId}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('org.placeholder')}
        autoComplete="off"
        autoCapitalize="words"
        autoFocus
        className="min-h-[52px] w-full rounded-2xl border-2 border-line bg-white px-4 text-[17px] outline-none focus:border-brand"
      />

      {matches.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[15px] font-semibold text-muted">{t('org.suggestions')}</p>
          <ul className="flex flex-col gap-2">
            {matches.map(({ org }) => (
              <li key={org.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(orgFromMaster(org, typed), org)
                    setEditing(false)
                  }}
                  className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl border-2 border-line bg-white px-4 py-3 text-left hover:border-brand"
                >
                  <span className="flex-1">
                    <span className="block font-semibold leading-snug">{org.normalizedName}</span>
                    <span className="block text-[15px] text-muted">{[org.city, org.state, org.country].filter(Boolean).join(', ')}</span>
                  </span>
                  <span className="rounded-xl bg-brand px-3 py-1.5 text-[15px] font-semibold text-white">✓</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {typed.length >= 2 && (
        <div className="mt-5 rounded-2xl border-2 border-dashed border-line p-4">
          <p className="font-semibold">{t(`org.notFound.${kind}`)}</p>
          <p className="mt-2 text-[15px] text-muted">{t('org.savedAs')}</p>
          <p className="font-semibold">{normalized}</p>
          <Button
            variant="secondary"
            size="md"
            block
            className="mt-3"
            onClick={() => {
              onSelect(orgFromCandidate(typed), null)
              setEditing(false)
            }}
          >
            {t(`org.addNew.${kind}`)}
          </Button>
        </div>
      )}
      {typed.length < 2 && <p className="mt-2 text-[15px] text-muted">{t('org.typeMore')}</p>}
    </div>
  )
}
