'use client'

import { useI18n } from '@/i18n'
import { newEntryPath } from '@/domain/entries/entries'
import { useCandidate } from '@/components/candidate/CandidateProvider'
import { CandidateHeader, Page } from '@/components/candidate/CandidateChrome'
import { TypeCard } from '@/components/candidate/HomeParts'

/** Choose work / activity type – three cards. */
export default function AddExperiencePage() {
  const { t, helper } = useI18n()
  const { token } = useCandidate()
  return (
    <Page className="pb-16">
      <CandidateHeader back={`/candidate/${token}`} />
      <h1 className="mt-6 text-[24px] font-bold">{t('addWork.title')}</h1>
      {helper('addWork.title') && <p className="mt-1 text-muted">{helper('addWork.title')}</p>}
      <div className="mt-6 flex flex-col gap-3">
        <TypeCard href={newEntryPath(token, 'professional_experience')} icon="🏥" title={t('addWork.job')} description={t('addWork.jobDesc')} />
        <TypeCard href={newEntryPath(token, 'career_break')} icon="⏸" title={t('addWork.break')} description={t('addWork.breakDesc')} />
        <TypeCard href={newEntryPath(token, 'volunteering')} icon="❤️" title={t('addWork.volunteer')} description={t('addWork.volunteerDesc')} />
      </div>
    </Page>
  )
}
