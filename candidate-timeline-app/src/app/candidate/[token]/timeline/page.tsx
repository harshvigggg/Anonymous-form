'use client'

import { useI18n } from '@/i18n'
import { useCandidate } from '@/components/candidate/CandidateProvider'
import { CandidateHeader, Page } from '@/components/candidate/CandidateChrome'
import { TimelineVisual } from '@/components/timeline/TimelineVisual'
import { ButtonLink } from '@/components/ui'
import { gapHref } from '@/components/candidate/fixLinks'

export default function TimelinePage() {
  const { t } = useI18n()
  const { token, validation, locked } = useCandidate()
  const overlapIds = new Set(validation.overlaps.flatMap((o) => [o.entryIdA, o.entryIdB]))
  const hasEntries = validation.entries.some((e) => e.status !== 'draft')
  return (
    <Page className="pb-16">
      <CandidateHeader back={`/candidate/${token}`} />
      <h1 className="mb-5 mt-6 text-[24px] font-bold">{t('timeline.title')}</h1>
      {hasEntries ? (
        <TimelineVisual
          entries={validation.entries}
          gaps={validation.openGaps}
          presentLabel={t('common.present')}
          missingLabel={t('timeline.missing')}
          overlapIds={overlapIds}
          overlapLabel={t('timeline.overlapNote')}
          renderGapAction={(g) =>
            locked ? null : (
              <ButtonLink href={gapHref(token, g.key, validation.entries)} variant="warn" block className="mt-3">
                {t('home.fixPeriod')}
              </ButtonLink>
            )
          }
        />
      ) : (
        <p className="text-muted">{t('timeline.empty')}</p>
      )}
    </Page>
  )
}
