'use client'

import { useMemo, useState } from 'react'
import { useI18n } from '@/i18n'
import { Check, cx } from '@/components/ui'

export interface MultiOption {
  id: string
  label: string
  group?: string
}

/**
 * Checkbox list that shows the most relevant options first and hides the rest
 * behind "Show more" – never hundreds of items at once.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  priority,
  max,
  label,
  showMoreLabel,
  showLessLabel,
  groupLabels,
}: {
  options: MultiOption[]
  value: string[]
  /** Receives an updater so rapid taps never work on a stale list. */
  onChange: (update: (prev: string[]) => string[]) => void
  priority: string[]
  max?: number
  label: string
  showMoreLabel: string
  showLessLabel: string
  groupLabels?: Record<string, string>
}) {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(() => value.some((id) => !priority.includes(id)))
  const atMax = max !== undefined && value.length >= max

  const { top, rest } = useMemo(() => {
    const byId = new Map(options.map((o) => [o.id, o]))
    const topList = priority.map((id) => byId.get(id)).filter((o): o is MultiOption => !!o)
    const topIds = new Set(topList.map((o) => o.id))
    return { top: topList, rest: options.filter((o) => !topIds.has(o.id)) }
  }, [options, priority])

  const toggle = (id: string) =>
    onChange((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : max !== undefined && prev.length >= max ? prev : [...prev, id]))

  const renderItem = (o: MultiOption) => {
    const checked = value.includes(o.id)
    const disabled = !checked && atMax
    return (
      <button
        key={o.id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled}
        onClick={() => toggle(o.id)}
        className={cx(
          'flex min-h-[52px] w-full items-center gap-3 rounded-2xl border-2 px-4 py-2.5 text-left transition-colors',
          checked ? 'border-brand bg-brand-soft' : 'border-line bg-white',
          disabled && 'opacity-45',
        )}
      >
        <span
          className={cx('flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2', checked ? 'border-brand bg-brand text-white' : 'border-[#c4ccca]')}
          aria-hidden
        >
          {checked && <Check className="h-4 w-4" />}
        </span>
        <span className="flex-1 font-medium leading-snug">{o.label}</span>
      </button>
    )
  }

  const groupedRest = useMemo(() => {
    if (!groupLabels) return [{ key: '', items: rest }]
    const groups = new Map<string, MultiOption[]>()
    for (const o of rest) groups.set(o.group ?? '', [...(groups.get(o.group ?? '') ?? []), o])
    return [...groups.entries()].map(([key, items]) => ({ key, items }))
  }, [rest, groupLabels])

  return (
    <div role="group" aria-label={label}>
      <div className="flex flex-col gap-2">{top.map(renderItem)}</div>
      {rest.length > 0 && (
        <>
          {expanded &&
            groupedRest.map((g) => (
              <div key={g.key} className="mt-4">
                {g.key && groupLabels?.[g.key] && <p className="mb-2 text-[13px] font-bold uppercase tracking-wide text-muted">{groupLabels[g.key]}</p>}
                <div className="flex flex-col gap-2">{g.items.map(renderItem)}</div>
              </div>
            ))}
          <button
            type="button"
            onClick={() => setExpanded((x) => !x)}
            className="mt-3 min-h-[48px] w-full rounded-2xl border-2 border-dashed border-brand-line font-semibold text-brand-dark"
            aria-expanded={expanded}
          >
            {expanded ? showLessLabel : `${showMoreLabel} (${rest.length})`}
          </button>
        </>
      )}
      {atMax && <p className="mt-3 text-[15px] font-medium text-warn">{t('multi.max', { max: max! })}</p>}
    </div>
  )
}
