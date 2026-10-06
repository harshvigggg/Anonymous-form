'use client'

import { byId } from '@/config/types'
import { homeQualificationNames, trainingQualifications } from '@/config/qualifications'
import { textLimits } from '@/config/validationRules'
import type { TrainingEntry } from '@/domain/timeline/types'
import { displayOrg } from '@/lib/normalization/orgName'
import { OptionList } from '@/components/forms/OptionList'
import { TextInput } from '@/components/forms/TextInput'
import { OrgSearch } from '@/components/forms/OrgSearch'
import { EvidenceUpload } from '@/components/forms/EvidenceUpload'
import { choiceStep, dateStep, locationStep } from './shared'
import type { WizardDefinition } from './types'

const qualificationOf = (v: TrainingEntry) => byId(trainingQualifications, v.qualificationId)

/** Education › Add Training (candidate sees "Nursing / College Education"). */
export const trainingWizard: WizardDefinition<TrainingEntry> = {
  type: 'training',
  backPath: (token) => `/candidate/${token}/education/new`,
  steps: [
    {
      ...choiceStep<TrainingEntry>({
      id: 'qualification',
      question: 'q.training.qualification',
      field: 'qualificationId',
      textField: 'otherQualification',
      textLabel: 'q.training.otherQualification',
      options: trainingQualifications,
      // System mapping: pick the home-country name automatically when there is only one.
      onPick: (q, v) => {
        const tq = byId(trainingQualifications, q.id)!
        const home = tq.homeNames.length === 1 ? tq.homeNames[0] : tq.homeNames.includes(v.homeQualificationId ?? '') ? v.homeQualificationId : tq.homeNames.length === 0 ? 'other' : null
        return {
          homeQualificationId: home,
          ...(home !== 'other' ? { otherHomeQualification: '' } : {}),
          recognitionEligibility: tq.recognitionEligibility,
          recognitionSource: tq.recognitionEligibility === 'eligible' ? 'system' : null,
        }
      },
      // For "Other", the name typed is also the home-country name – no need to type it twice.
      onText: (text, v) => (v.qualificationId === 'other' ? { otherHomeQualification: text } : {}),
      }),
      summary: (v) => {
        const q = qualificationOf(v)
        if (!q) return null
        const name = q.requiresText ? v.otherQualification || '—' : q.label
        const home = v.homeQualificationId && v.homeQualificationId !== 'other' ? byId(homeQualificationNames, v.homeQualificationId)?.label : null
        return home && q.homeNames.length === 1 ? (
          <>
            {name}
            <span className="block text-[15px] font-normal text-muted">{home}</span>
          </>
        ) : (
          name
        )
      },
    },
    {
      id: 'homeName',
      question: 'q.training.homeName',
      help: 'help.training.homeName',
      fields: ['homeQualificationId', 'otherHomeQualification'],
      visible: (v) => {
        const q = qualificationOf(v)
        return !!q && q.homeNames.length !== 1 && q.id !== 'other'
      },
      render: ({ values, set, next, t }) => {
        const q = qualificationOf(values)!
        const options = q.homeNames.length ? [...homeQualificationNames.filter((h) => q.homeNames.includes(h.id)), byId(homeQualificationNames, 'other')!] : []
        return (
          <>
            {options.length > 0 && (
              <OptionList
                label={t('q.training.homeName')}
                options={options}
                value={values.homeQualificationId}
                onChange={(id) => {
                  set({ homeQualificationId: id, ...(id !== 'other' ? { otherHomeQualification: '' } : {}) })
                  if (id !== 'other') next()
                }}
              />
            )}
            {values.homeQualificationId === 'other' && (
              <TextInput
                label={t('q.training.otherHomeName')}
                value={values.otherHomeQualification}
                maxLength={textLimits.shortText}
                autoFocus={options.length === 0}
                onChange={(text) => set({ otherHomeQualification: text })}
              />
            )}
          </>
        )
      },
      summary: (v) => {
        if (!v.homeQualificationId) return null
        return v.homeQualificationId === 'other' ? v.otherHomeQualification || null : byId(homeQualificationNames, v.homeQualificationId)?.label
      },
    },
    {
      id: 'institution',
      question: 'q.training.institution',
      help: 'help.training.institution',
      fields: ['institution'],
      render: ({ values, set, next, t, ctx }) => (
        <OrgSearch
          kind="institution"
          label={t('q.training.institution')}
          value={values.institution}
          additions={ctx.orgAdditions}
          onSelect={(org, master) => {
            set({ institution: org, ...(master ? { city: master.city, cityId: master.cityId, country: master.country } : {}) })
            if (org) next()
          }}
        />
      ),
      summary: (v) => displayOrg(v.institution) || null,
    },
    dateStep<TrainingEntry>({ id: 'start', question: 'q.training.start', field: 'startDate' }),
    dateStep<TrainingEntry>({ id: 'end', question: 'q.training.end', field: 'endDate' }),
    dateStep<TrainingEntry>({ id: 'diploma', question: 'q.training.diploma', field: 'diplomaDate', defaultMode: 'day', help: 'help.training.diploma' }),
    locationStep<TrainingEntry>({ id: 'location', question: 'q.training.location' }),
    {
      id: 'evidence',
      question: 'q.training.evidence',
      help: 'help.training.evidence',
      fields: [],
      skip: { evidenceSkipped: true },
      render: ({ values, set, ctx }) => (
        <EvidenceUpload value={values.evidence} upload={ctx.uploadEvidence} onChange={(evidence) => set({ evidence, evidenceSkipped: false })} />
      ),
      summaryLabel: 'field.evidence',
      summary: (v, _ctx, t) => (v.evidence ? t('evidence.uploaded') : '—'),
    },
  ],
}
