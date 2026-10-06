'use client'

import { useI18n } from '@/i18n'
import { newEntryPath } from '@/domain/entries/entries'
import { useCandidate } from '@/components/candidate/CandidateProvider'
import { CandidateHeader, Page } from '@/components/candidate/CandidateChrome'
import { TypeCard } from '@/components/candidate/HomeParts'

/** Choose education type – only two large cards. */
export default function AddEducationPage() {
  const { t, helper } = useI18n()
  const { token } = useCandidate()
  return (
    <Page className="pb-16">
      <CandidateHeader back={`/candidate/${token}`} />
      <h1 className="mt-6 text-[24px] font-bold">{t('addEdu.title')}</h1>
      {helper('addEdu.title') && <p className="mt-1 text-muted">{helper('addEdu.title')}</p>}
      <div className="mt-6 flex flex-col gap-3">
        <TypeCard href={newEntryPath(token, 'training')} icon="🎓" title={t('addEdu.training')} description={t('addEdu.trainingDesc')} />
        <TypeCard href={newEntryPath(token, 'school')} icon="🏫" title={t('addEdu.school')} description={t('addEdu.schoolDesc')} />
      </div>
    </Page>
  )
}
