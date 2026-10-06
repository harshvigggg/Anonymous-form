'use client'

import { careerBreakTypes } from '@/config/careerBreakTypes'
import type { CareerBreakEntry } from '@/domain/timeline/types'
import { YesNo } from '@/components/forms/OptionList'
import { choiceStep, dateStep, GapBanner, locationStep, ongoingStep, previousEntryFor, rangeSummary } from './shared'
import type { WizardDefinition } from './types'

const fromGap = (v: CareerBreakEntry) => !!v.sourceGapKey && !v.editDates

/**
 * Work Experience › Career Break.
 * Usually opened from a detected gap: the dates arrive pre-filled, so the
 * candidate only says what they were doing and where they lived.
 */
export const careerBreakWizard: WizardDefinition<CareerBreakEntry> = {
  type: 'career_break',
  backPath: (token) => `/candidate/${token}`,
  prepare: (entry, ctx, search) => {
    const gap = ctx.validation.gaps.find((g) => g.key === search.get('gap'))
    if (!gap) return entry
    const prev = ctx.entries.find((e) => e.id === gap.previousEntryId && e.city)
    return {
      ...entry,
      startDate: gap.startDate,
      startDatePrecision: gap.startDatePrecision,
      endDate: gap.endIsPresent ? null : gap.endDate,
      endDatePrecision: gap.endIsPresent ? 'unknown' : gap.endDatePrecision,
      ongoing: gap.endIsPresent,
      sourceGapKey: gap.key,
      previousCityEntryId: prev?.id ?? null,
    }
  },
  steps: [
    choiceStep<CareerBreakEntry>({
      id: 'type',
      question: 'q.break.type',
      field: 'breakTypeId',
      textField: 'otherBreakType',
      textLabel: 'q.break.otherType',
      options: careerBreakTypes,
      searchable: false,
      intro: (v, _ctx, t) =>
        v.sourceGapKey && v.startDate ? <GapBanner start={v.startDate} end={v.endDate ?? ''} present={!!v.ongoing} t={t} /> : null,
    }),
    {
      ...dateStep<CareerBreakEntry>({ id: 'start', question: 'q.break.start', field: 'startDate', visible: (v) => !fromGap(v) }),
      summaryLabel: 'field.dates',
      summary: (v, _c, t) => rangeSummary(v, t),
      summaryWhenHidden: true,
      reveal: { editDates: true },
    },
    ongoingStep<CareerBreakEntry>({ id: 'ongoing', question: 'q.break.ongoing', yesLabel: 'q.break.ongoingYes', visible: (v) => !fromGap(v) }),
    dateStep<CareerBreakEntry>({ id: 'end', question: 'q.break.end', field: 'endDate', visible: (v) => !fromGap(v) && v.ongoing === false, summary: false }),
    {
      id: 'sameCity',
      question: 'q.break.sameCity',
      fields: ['sameCityAsPrevious'],
      visible: (v, ctx) => !!previousEntryFor(v, ctx),
      check: (v) => (v.sameCityAsPrevious === null ? 'err.answerRequired' : null),
      render: ({ values, set, next, t, ctx }) => {
        const prev = previousEntryFor(values, ctx)!
        return (
          <>
            <p className="mb-4 inline-flex rounded-full bg-surface px-3 py-1.5 font-semibold">
              📍 {t('q.break.previousCity', { city: [prev.city, prev.country].filter(Boolean).join(', ') })}
            </p>
            <YesNo
              label={t('q.break.sameCity')}
              value={values.sameCityAsPrevious}
              yesLabel={t('common.yes')}
              noLabel={t('common.no')}
              onChange={(yes) => {
                // Reuse the previous city – no typing needed.
                set(
                  yes
                    ? { sameCityAsPrevious: true, previousCityEntryId: prev.id, city: prev.city, cityId: prev.cityId, country: prev.country }
                    : { sameCityAsPrevious: false, previousCityEntryId: prev.id, ...(values.sameCityAsPrevious ? { city: null, cityId: null, country: null } : {}) },
                )
                next()
              }}
            />
          </>
        )
      },
    },
    {
      ...locationStep<CareerBreakEntry>({ id: 'location', question: 'q.break.location', visible: (v, ctx) => v.sameCityAsPrevious !== true || !previousEntryFor(v, ctx) }),
      // Show the reused city on the check screen too; "Change" lets the candidate pick another one.
      summaryWhenHidden: true,
      reveal: { sameCityAsPrevious: false, city: null, cityId: null, country: null },
    },
  ],
}
