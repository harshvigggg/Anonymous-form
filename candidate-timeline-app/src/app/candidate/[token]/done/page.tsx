'use client'

import { useI18n } from '@/i18n'
import { useCandidate } from '@/components/candidate/CandidateProvider'
import { Page, SaveErrorBanner, SaveIndicator } from '@/components/candidate/CandidateChrome'
import { ButtonLink } from '@/components/ui'

export default function DonePage() {
  const { t, helper } = useI18n()
  const { token, saveState } = useCandidate()
  return (
    <Page className="flex flex-col items-center py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-ok-soft text-[40px]" aria-hidden>✅</div>
      <h1 className="mt-6 text-[26px] font-bold">{t('done.title')}</h1>
      <p className="mt-3 max-w-sm">{t('done.text')}</p>
      {helper('done.text') && <p className="mt-2 max-w-sm text-muted">{helper('done.text')}</p>}
      <div className="mt-4"><SaveIndicator state={saveState} /></div>
      <div className="w-full"><SaveErrorBanner /></div>
      <ButtonLink href={`/candidate/${token}`} variant="secondary" className="mt-8">{t('done.back')}</ButtonLink>
    </Page>
  )
}
