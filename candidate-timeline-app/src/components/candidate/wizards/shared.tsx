'use client'

import type { ReactNode } from 'react'
import { byId, type CatalogOption } from '@/config/types'
import { textLimits } from '@/config/validationRules'
import { formatDate, formatRange, type DatePrecision } from '@/domain/dates'
import type { TimelineEntry } from '@/domain/timeline/types'
import type { Translate } from '@/i18n'
import { OptionList, YesNo } from '@/components/forms/OptionList'
import { TextInput } from '@/components/forms/TextInput'
import { DatePrecisionPicker } from '@/components/forms/DatePrecisionPicker'
import { CityCountryField } from '@/components/forms/CityCountryField'
import type { WizardContext, WizardStep } from './types'

type Any = TimelineEntry & Record<string, unknown>

/** Single choice from a catalog, with a short text box when "Other" is picked. */
export function choiceStep<E extends TimelineEntry>(cfg: {
  id: string
  question: string
  field: keyof E & string
  textField: keyof E & string
  textLabel: string
  options: CatalogOption[] | ((v: E) => CatalogOption[])
  searchable?: boolean
  onPick?: (option: CatalogOption, v: E) => Partial<E>
  /** Extra fields to update while the "Other" text is typed */
  onText?: (text: string, v: E) => Partial<E>
  visible?: WizardStep<E>['visible']
  intro?: WizardStep<E>['intro']
  help?: string
}): WizardStep<E> {
  const list = (v: E) => (typeof cfg.options === 'function' ? cfg.options(v) : cfg.options)
  return {
    id: cfg.id,
    question: cfg.question,
    help: cfg.help,
    intro: cfg.intro,
    visible: cfg.visible,
    fields: [cfg.field, cfg.textField],
    render: ({ values, set, next, t }) => {
      const v = values as unknown as Any
      const options = list(values)
      const selected = byId(options, v[cfg.field] as string)
      return (
        <>
          <OptionList
            label={t(cfg.question)}
            options={options}
            value={(v[cfg.field] as string) ?? null}
            searchable={cfg.searchable}
            onChange={(id) => {
              const opt = byId(options, id)!
              set({ [cfg.field]: id, ...(opt.requiresText ? {} : { [cfg.textField]: '' }), ...(cfg.onPick?.(opt, values) ?? {}) } as Partial<E>)
              if (!opt.requiresText) next()
            }}
          />
          {selected?.requiresText && (
            <TextInput
              label={t(cfg.textLabel)}
              value={(v[cfg.textField] as string) ?? ''}
              maxLength={textLimits.shortText}
              autoFocus
              onChange={(text) => set({ [cfg.textField]: text, ...(cfg.onText?.(text, values) ?? {}) } as Partial<E>)}
            />
          )}
        </>
      )
    },
    summary: (values) => {
      const v = values as unknown as Any
      const o = byId(list(values), v[cfg.field] as string)
      if (!o) return null
      return o.requiresText ? `${o.label}: ${(v[cfg.textField] as string) || '—'}` : o.label
    },
  }
}

export function dateStep<E extends TimelineEntry>(cfg: {
  id: string
  question: string
  field: 'startDate' | 'endDate' | 'diplomaDate'
  defaultMode?: 'day' | 'month'
  help?: string
  visible?: WizardStep<E>['visible']
  summaryLabel?: string
  summary?: WizardStep<E>['summary'] | false
}): WizardStep<E> {
  const precisionField = `${cfg.field}Precision`
  return {
    id: cfg.id,
    question: cfg.question,
    help: cfg.help,
    visible: cfg.visible,
    fields: [cfg.field],
    render: ({ values, set, t }) => (
      <DatePrecisionPicker
        label={t(cfg.question)}
        value={((values as unknown as Any)[cfg.field] as string) ?? null}
        defaultMode={cfg.defaultMode ?? 'month'}
        onChange={(value: string | null, precision: DatePrecision) => set({ [cfg.field]: value, [precisionField]: precision } as Partial<E>)}
      />
    ),
    summaryLabel: cfg.summaryLabel,
    summary:
      cfg.summary === false
        ? undefined
        : cfg.summary ?? ((values) => {
            const value = (values as unknown as Any)[cfg.field] as string | null
            return value ? formatDate(value) : null
          }),
  }
}

export function ongoingStep<E extends TimelineEntry>(cfg: { id: string; question: string; yesLabel: string; visible?: WizardStep<E>['visible'] }): WizardStep<E> {
  return {
    id: cfg.id,
    question: cfg.question,
    visible: cfg.visible,
    fields: ['ongoing'],
    render: ({ values, set, next, t }) => (
      <YesNo
        label={t(cfg.question)}
        value={values.ongoing}
        yesLabel={t(cfg.yesLabel)}
        noLabel={t('common.no')}
        onChange={(yes) => {
          set((yes ? { ongoing: true, endDate: null, endDatePrecision: 'unknown' } : { ongoing: false }) as Partial<E>)
          next()
        }}
      />
    ),
  }
}

export function locationStep<E extends TimelineEntry>(cfg: { id: string; question: string; visible?: WizardStep<E>['visible'] }): WizardStep<E> {
  return {
    id: cfg.id,
    question: cfg.question,
    visible: cfg.visible,
    fields: ['city', 'country'],
    render: ({ values, set, t }) => (
      <CityCountryField
        label={t(cfg.question)}
        value={{ city: values.city, cityId: values.cityId, country: values.country }}
        onChange={(loc) => set(loc as Partial<E>)}
      />
    ),
    summaryLabel: 'field.location',
    summary: (v) => (v.city ? [v.city, v.country].filter(Boolean).join(', ') : null),
  }
}

/** "Jan 2025 – Jul 2025" style summary for start+end rows. */
export function rangeSummary(v: TimelineEntry, t: Translate): ReactNode {
  if (!v.startDate) return null
  if (v.ongoing === false && !v.endDate) return `${formatDate(v.startDate)} – ?`
  return formatRange(v.startDate, v.endDate, v.ongoing, t('common.present'))
}

export function GapBanner({ start, end, present, t }: { start: string; end: string; present: boolean; t: Translate }) {
  return (
    <div className="mb-5 rounded-[var(--radius-card)] border border-warn-line bg-warn-soft p-4">
      <p className="text-[15px] font-semibold text-warn">⚠ {t('q.break.gapIntro')}</p>
      <p className="mt-1 text-[20px] font-bold">{formatRange(start, end, present, t('common.present'))}</p>
    </div>
  )
}

export function previousEntryFor(v: TimelineEntry, ctx: WizardContext): TimelineEntry | undefined {
  if (v.type === 'career_break' && v.sourceGapKey) {
    const gap = ctx.validation.gaps.find((g) => g.key === v.sourceGapKey)
    const prev = ctx.entries.find((e) => e.id === (v.previousCityEntryId ?? gap?.previousEntryId))
    if (prev?.city) return prev
  }
  if (!v.startDate) return undefined
  return ctx.entries
    .filter((e) => e.id !== v.id && e.status !== 'draft' && e.city && (e.ongoing ? false : e.endDate && e.endDate <= v.startDate!))
    .sort((a, b) => (b.endDate ?? '').localeCompare(a.endDate ?? ''))[0]
}
