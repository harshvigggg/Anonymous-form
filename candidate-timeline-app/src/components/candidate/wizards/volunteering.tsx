'use client'

import { volunteeringSuggestions } from '@/config/volunteering'
import { textLimits } from '@/config/validationRules'
import type { VolunteeringEntry } from '@/domain/timeline/types'
import { TextInput } from '@/components/forms/TextInput'
import { cx } from '@/components/ui'
import { dateStep, locationStep, ongoingStep, rangeSummary } from './shared'
import type { WizardDefinition } from './types'

/** Work Experience › Volunteering – a short form. */
export const volunteeringWizard: WizardDefinition<VolunteeringEntry> = {
  type: 'volunteering',
  backPath: (token) => `/candidate/${token}/experience/new`,
  steps: [
    {
      id: 'purpose',
      question: 'q.vol.purpose',
      help: 'help.vol.purpose',
      fields: ['purpose'],
      render: ({ values, set, t }) => (
        <>
          <div className="flex flex-wrap gap-2">
            {volunteeringSuggestions.map((s) => {
              const active = values.purpose.trim().toLowerCase() === s.toLowerCase()
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ purpose: s })}
                  className={cx(
                    'min-h-[44px] rounded-full border-2 px-4 font-semibold',
                    active ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand-line',
                  )}
                >
                  {s}
                </button>
              )
            })}
          </div>
          <TextInput label={t('field.purpose')} value={values.purpose} maxLength={textLimits.shortText} onChange={(purpose) => set({ purpose })} />
        </>
      ),
      summary: (v) => v.purpose || null,
    },
    dateStep<VolunteeringEntry>({ id: 'start', question: 'q.vol.start', field: 'startDate', summaryLabel: 'field.dates', summary: (v, _c, t) => rangeSummary(v, t) }),
    ongoingStep<VolunteeringEntry>({ id: 'ongoing', question: 'q.vol.ongoing', yesLabel: 'q.vol.ongoingYes' }),
    dateStep<VolunteeringEntry>({ id: 'end', question: 'q.vol.end', field: 'endDate', visible: (v) => v.ongoing === false, summary: false }),
    locationStep<VolunteeringEntry>({ id: 'location', question: 'q.vol.location' }),
  ],
}
