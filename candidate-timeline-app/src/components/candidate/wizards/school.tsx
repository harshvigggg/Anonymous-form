'use client'

import { schoolQualifications } from '@/config/qualifications'
import type { SchoolEntry } from '@/domain/timeline/types'
import { displayOrg } from '@/lib/normalization/orgName'
import { OrgSearch } from '@/components/forms/OrgSearch'
import { choiceStep, dateStep, locationStep } from './shared'
import type { WizardDefinition } from './types'

/** Education › General School Leaving Certificate (candidate sees "School Education"). */
export const schoolWizard: WizardDefinition<SchoolEntry> = {
  type: 'school',
  backPath: (token) => `/candidate/${token}/education/new`,
  steps: [
    choiceStep<SchoolEntry>({
      id: 'qualification',
      question: 'q.school.qualification',
      field: 'schoolQualificationId',
      textField: 'otherSchoolQualification',
      textLabel: 'q.school.otherQualification',
      options: schoolQualifications,
    }),
    {
      id: 'institution',
      question: 'q.school.institution',
      help: 'help.school.institution',
      fields: ['institution'],
      render: ({ values, set, next, t, ctx }) => (
        <OrgSearch
          kind="school"
          label={t('q.school.institution')}
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
    dateStep<SchoolEntry>({ id: 'start', question: 'q.school.start', field: 'startDate', help: 'help.school.start' }),
    dateStep<SchoolEntry>({ id: 'end', question: 'q.school.end', field: 'endDate' }),
    dateStep<SchoolEntry>({ id: 'diploma', question: 'q.school.diploma', field: 'diplomaDate', defaultMode: 'day' }),
    locationStep<SchoolEntry>({ id: 'location', question: 'q.school.location' }),
  ],
}
