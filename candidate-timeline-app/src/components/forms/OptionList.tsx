'use client'

import { useId, useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { matchScore } from '@/lib/normalization/text'
import { Check, cx } from '@/components/ui'

export interface Option {
  id: string
  label: string
  description?: string
  icon?: string
}

/**
 * Single-choice list with large tap targets. Becomes searchable when long.
 * `onPick` fires after a tap – the wizard uses it to move on automatically.
 */
export function OptionList({
  options,
  value,
  onChange,
  onPick,
  searchable,
  label,
}: {
  options: Option[]
  value: string | null
  onChange: (id: string) => void
  onPick?: (id: string) => void
  searchable?: boolean
  label: string
}) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const showSearch = searchable ?? options.length > 9
  const name = useId()

  const visible = useMemo(() => {
    if (!query.trim()) return options
    return options
      .map((o) => ({ o, s: Math.max(matchScore(query, o.label), o.description ? matchScore(query, o.description) * 0.9 : 0) }))
      .filter((x) => x.s > 0 || x.o.id === 'other')
      .sort((a, b) => b.s - a.s)
      .map((x) => x.o)
  }, [options, query])

  return (
    <div>
      {showSearch && (
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('options.search')}
          aria-label={t('options.search')}
          className="mb-3 min-h-[52px] w-full rounded-2xl border-2 border-line bg-white px-4 text-[17px] outline-none focus:border-brand"
        />
      )}
      <div role="radiogroup" aria-label={label} className="flex flex-col gap-2.5">
        {visible.map((o) => {
          const selected = o.id === value
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected}
              name={name}
              onClick={() => {
                onChange(o.id)
                onPick?.(o.id)
              }}
              className={cx(
                'flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors',
                selected ? 'border-brand bg-brand-soft' : 'border-line bg-white hover:border-brand-line',
              )}
            >
              {o.icon && <span className="text-[22px] leading-none" aria-hidden>{o.icon}</span>}
              <span className="flex-1">
                <span className="block font-semibold leading-snug">{o.label}</span>
                {o.description && <span className="mt-0.5 block text-[15px] leading-snug text-muted">{o.description}</span>}
              </span>
              <span
                className={cx(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                  selected ? 'border-brand bg-brand text-white' : 'border-[#c4ccca]',
                )}
                aria-hidden
              >
                {selected && <Check className="h-4 w-4" />}
              </span>
            </button>
          )
        })}
        {visible.length === 0 && <p className="py-4 text-center text-muted">{t('options.noResults')}</p>}
      </div>
    </div>
  )
}

export function YesNo({
  value,
  onChange,
  yesLabel,
  noLabel,
  label,
}: {
  value: boolean | null
  onChange: (v: boolean) => void
  yesLabel: string
  noLabel: string
  label: string
}) {
  return (
    <OptionList
      label={label}
      options={[
        { id: 'yes', label: yesLabel },
        { id: 'no', label: noLabel },
      ]}
      value={value === null ? null : value ? 'yes' : 'no'}
      onChange={(id) => onChange(id === 'yes')}
    />
  )
}
