'use client'

import { useState } from 'react'
import { byId } from '@/config/types'
import { jobTitles } from '@/config/jobTitles'
import { bedCountOptions, facilityTypes, isInpatient } from '@/config/facilityTypes'
import { departments, getDepartment, priorityTasksFor, requiresConditions, requiresEquipment } from '@/config/departments'
import { employmentRelationships } from '@/config/employmentRelationships'
import { tasks, taskGroups } from '@/config/tasks'
import { conditions } from '@/config/conditions'
import { equipment } from '@/config/equipment'
import { entryRules, textLimits } from '@/config/validationRules'
import type { JobEntry } from '@/domain/timeline/types'
import { displayOrg } from '@/lib/normalization/orgName'
import { OptionList, YesNo } from '@/components/forms/OptionList'
import { MultiSelect } from '@/components/forms/MultiSelect'
import { TextArea, TextInput } from '@/components/forms/TextInput'
import { OrgSearch } from '@/components/forms/OrgSearch'
import { choiceStep, dateStep, locationStep, ongoingStep, rangeSummary } from './shared'
import type { StepRenderProps, WizardDefinition } from './types'

const deptLabel = (v: JobEntry) => getDepartment(v.departmentId)?.label ?? ''
const labels = (ids: string[], list: { id: string; label: string }[], other?: string) =>
  ids.map((id) => (id === 'other' && other ? `Other: ${other}` : byId(list, id)?.label ?? id)).join(', ') || null

function EmploymentStep({ values, set, next, t }: StepRenderProps<JobEntry>) {
  const current = byId(employmentRelationships, values.employmentRelationshipId)
  const [showAll, setShowAll] = useState(!!current && !current.common)
  const common = employmentRelationships.filter((e) => e.common)
  const rest = employmentRelationships.filter((e) => !e.common)
  const options = showAll ? [...common, ...rest] : [...common, { id: '__more', label: t('q.job.employmentMore'), target: '' }]
  return (
    <OptionList
      label={t('q.job.employment')}
      options={options}
      value={values.employmentRelationshipId}
      onChange={(id) => {
        if (id === '__more') return setShowAll(true)
        set({ employmentRelationshipId: id })
        next()
      }}
    />
  )
}

/** Work Experience › Professional Experience. */
export const jobWizard: WizardDefinition<JobEntry> = {
  type: 'professional_experience',
  backPath: (token) => `/candidate/${token}/experience/new`,
  steps: [
    choiceStep<JobEntry>({
      id: 'title',
      question: 'q.job.title',
      field: 'jobTitleId',
      textField: 'otherJobTitle',
      textLabel: 'q.job.otherTitle',
      options: jobTitles,
    }),
    {
      id: 'facility',
      question: 'q.job.facility',
      help: 'help.job.facility',
      fields: ['facility'],
      render: ({ values, set, next, t, ctx }) => (
        <OrgSearch
          kind="facility"
          label={t('q.job.facility')}
          value={values.facility}
          additions={ctx.orgAdditions}
          onSelect={(org, master) => {
            // Reuse what the verified record already knows.
            set({
              facility: org,
              ...(master?.facilityType ? { facilityTypeId: master.facilityType, otherFacilityType: '' } : {}),
              ...(master?.bedCountId ? { bedCountId: master.bedCountId, bedCountUnknown: false } : {}),
              ...(master ? { city: master.city, cityId: master.cityId, country: master.country } : {}),
            })
            if (org) next()
          }}
        />
      ),
      summary: (v) => displayOrg(v.facility) || null,
    },
    choiceStep<JobEntry>({
      id: 'facilityType',
      question: 'q.job.facilityType',
      field: 'facilityTypeId',
      textField: 'otherFacilityType',
      textLabel: 'q.job.otherFacilityType',
      options: facilityTypes,
      onPick: (o) => (isInpatient(o.id) ? {} : { bedCountId: null, bedCountUnknown: false }),
    }),
    {
      id: 'beds',
      question: 'q.job.beds',
      fields: ['bedCountId'],
      visible: (v) => isInpatient(v.facilityTypeId),
      render: ({ values, set, next, t }) => (
        <OptionList
          label={t('q.job.beds')}
          options={[...bedCountOptions, { id: 'unknown', label: t('q.job.bedsUnknown') }]}
          value={values.bedCountUnknown ? 'unknown' : values.bedCountId}
          onChange={(id) => {
            // "I don't know" saves no value and creates a warning – never a guess.
            set(id === 'unknown' ? { bedCountId: null, bedCountUnknown: true } : { bedCountId: id, bedCountUnknown: false })
            next()
          }}
        />
      ),
      summary: (v, _c, t) => (v.bedCountUnknown ? t('q.job.bedsUnknown') : byId(bedCountOptions, v.bedCountId)?.label ?? null),
    },
    choiceStep<JobEntry>({
      id: 'department',
      question: 'q.job.department',
      field: 'departmentId',
      textField: 'otherDepartment',
      textLabel: 'q.job.otherDepartment',
      options: departments,
      searchable: true,
      onPick: (d) => ({
        ...(requiresConditions(d.id) ? {} : { conditionIds: [], otherConditions: '' }),
        ...(requiresEquipment(d.id) ? {} : { equipmentIds: [], otherEquipment: '' }),
      }),
    }),
    dateStep<JobEntry>({ id: 'start', question: 'q.job.start', field: 'startDate', summaryLabel: 'field.dates', summary: (v, _c, t) => rangeSummary(v, t) }),
    ongoingStep<JobEntry>({ id: 'ongoing', question: 'q.job.ongoing', yesLabel: 'q.job.ongoingYes' }),
    dateStep<JobEntry>({ id: 'end', question: 'q.job.end', field: 'endDate', visible: (v) => v.ongoing === false, summary: false }),
    {
      id: 'employment',
      question: 'q.job.employment',
      fields: ['employmentRelationshipId'],
      render: (p) => <EmploymentStep {...p} />,
      summary: (v) => byId(employmentRelationships, v.employmentRelationshipId)?.label ?? null,
    },
    locationStep<JobEntry>({ id: 'location', question: 'q.job.location' }),
    {
      id: 'tasks',
      question: 'q.job.tasks',
      help: 'help.job.tasks',
      helpParams: () => ({ max: entryRules.maxTasks }),
      fields: ['taskIds', 'hasAdditionalTasks', 'additionalTasks'],
      render: ({ values, set, t }) => (
        <>
          <p className="mb-3 text-[15px] font-semibold text-brand-dark" aria-live="polite">
            {t('q.job.tasksCounter', { count: values.taskIds.length, max: entryRules.maxTasks })}
          </p>
          <MultiSelect
            label={t('q.job.tasks')}
            options={tasks}
            value={values.taskIds}
            onChange={(update) => set((v) => ({ taskIds: update(v.taskIds) }))}
            priority={priorityTasksFor(values.departmentId)}
            max={entryRules.maxTasks}
            showMoreLabel={t('q.job.showMoreTasks')}
            showLessLabel={t('q.job.showFewerTasks')}
            groupLabels={taskGroups}
          />
          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[18px] font-bold leading-snug">{t('q.job.additionalTasks')}</p>
            <div className="mt-3">
              <YesNo
                label={t('q.job.additionalTasks')}
                value={values.hasAdditionalTasks}
                yesLabel={t('common.yes')}
                noLabel={t('common.no')}
                onChange={(yes) => set(yes ? { hasAdditionalTasks: true } : { hasAdditionalTasks: false, additionalTasks: '' })}
              />
            </div>
            {values.hasAdditionalTasks && (
              <TextInput
                label={t('q.job.additionalTasksText')}
                value={values.additionalTasks}
                maxLength={textLimits.sentence}
                autoFocus
                onChange={(additionalTasks) => set({ additionalTasks })}
              />
            )}
          </div>
        </>
      ),
      summary: (v) => {
        const list = labels(v.taskIds, tasks)
        if (!list) return null
        return v.additionalTasks ? `${list}. ${v.additionalTasks}` : list
      },
    },
    {
      id: 'conditions',
      question: 'q.job.conditions',
      help: 'help.job.conditions',
      helpParams: (v) => ({ department: deptLabel(v) }),
      fields: ['conditionIds', 'otherConditions'],
      visible: (v) => requiresConditions(v.departmentId),
      render: ({ values, set, t }) => (
        <>
          <MultiSelect
            label={t('q.job.conditions')}
            options={conditions}
            value={values.conditionIds}
            onChange={(update) => set((v) => {
              const conditionIds = update(v.conditionIds)
              return { conditionIds, ...(conditionIds.includes('other') ? {} : { otherConditions: '' }) }
            })}
            priority={[...(getDepartment(values.departmentId)?.priorityConditions ?? []), 'other']}
            showMoreLabel={t('q.job.showMore')}
            showLessLabel={t('q.job.showFewerTasks')}
          />
          {values.conditionIds.includes('other') && (
            <TextInput label={t('q.job.otherConditions')} value={values.otherConditions} maxLength={textLimits.sentence} onChange={(otherConditions) => set({ otherConditions })} />
          )}
        </>
      ),
      summary: (v) => labels(v.conditionIds, conditions, v.otherConditions),
    },
    {
      id: 'equipment',
      question: 'q.job.equipment',
      help: 'help.job.equipment',
      helpParams: (v) => ({ department: deptLabel(v) }),
      fields: ['equipmentIds', 'otherEquipment'],
      visible: (v) => requiresEquipment(v.departmentId),
      render: ({ values, set, t }) => (
        <>
          <MultiSelect
            label={t('q.job.equipment')}
            options={equipment}
            value={values.equipmentIds}
            onChange={(update) => set((v) => {
              const equipmentIds = update(v.equipmentIds)
              return { equipmentIds, ...(equipmentIds.includes('other') ? {} : { otherEquipment: '' }) }
            })}
            priority={[...(getDepartment(values.departmentId)?.priorityEquipment ?? []), 'other']}
            showMoreLabel={t('q.job.showMore')}
            showLessLabel={t('q.job.showFewerTasks')}
          />
          {values.equipmentIds.includes('other') && (
            <TextInput label={t('q.job.otherEquipment')} value={values.otherEquipment} maxLength={textLimits.sentence} onChange={(otherEquipment) => set({ otherEquipment })} />
          )}
        </>
      ),
      summary: (v) => labels(v.equipmentIds, equipment, v.otherEquipment),
    },
    {
      id: 'additionalInfo',
      question: 'q.job.additionalInfo',
      help: 'help.job.additionalInfo',
      fields: ['additionalInfo'],
      skip: { additionalInfoSkipped: true },
      render: ({ values, set, t }) => (
        <TextArea
          label={t('q.job.additionalInfo')}
          value={values.additionalInfo}
          maxLength={textLimits.longText}
          onChange={(additionalInfo) => set({ additionalInfo, additionalInfoSkipped: false })}
        />
      ),
      summary: (v) => v.additionalInfo || '—',
    },
  ],
}
