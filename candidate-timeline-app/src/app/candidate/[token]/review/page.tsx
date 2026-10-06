'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/i18n'
import { earliestDay, formatDate } from '@/domain/dates'
import { EDUCATION_TYPES, entryDates, entryDetails, entryLocation, entrySubtitle, entryTitle, WORK_TYPES } from '@/domain/entries/entries'
import { auditEntry } from '@/domain/timeline/audit'
import type { TimelineEntry } from '@/domain/timeline/types'
import { Button, Card, Check, SectionTitle } from '@/components/ui'
import { useCandidate } from '@/components/candidate/CandidateProvider'
import { CandidateHeader, Page, SaveErrorBanner } from '@/components/candidate/CandidateChrome'
import { FixList, GapCard, OverlapCard } from '@/components/candidate/HomeParts'

const byStart = (a: TimelineEntry, b: TimelineEntry) => (earliestDay(a.startDate) ?? 0) - (earliestDay(b.startDate) ?? 0)

function Summary({ entry }: { entry: TimelineEntry }) {
  const { t } = useI18n()
  return (
    <li className="py-3.5">
      <p className="font-bold">{entryTitle(entry)}</p>
      {entry.type !== 'career_break' && entry.type !== 'volunteering' && <p>{entrySubtitle(entry)}</p>}
      <p className="text-muted">{entryDates(entry, t('common.present'))}</p>
      {'diplomaDate' in entry && entry.diplomaDate && <p className="text-muted">{t('review.diplomaDate', { date: formatDate(entry.diplomaDate) })}</p>}
      {entryDetails(entry).map((d) => <p key={d} className="text-muted">{d}</p>)}
      {entryLocation(entry) && <p className="text-[15px] text-muted">{entryLocation(entry)}</p>}
    </li>
  )
}

/** Final candidate review – a clean summary, then submit. */
export default function ReviewPage() {
  const { t, helper } = useI18n()
  const router = useRouter()
  const { token, validation, status, updateProfile } = useCandidate()
  const [busy, setBusy] = useState(false)
  const entries = validation.entries.filter((e) => e.status !== 'draft')
  const education = entries.filter((e) => EDUCATION_TYPES.includes(e.type)).sort(byStart)
  const work = entries.filter((e) => WORK_TYPES.includes(e.type)).sort(byStart)

  const eduErrors = validation.errors.some((i) => i.code === 'REQUIRED_SECTION_MISSING' || EDUCATION_TYPES.includes(validation.entries.find((e) => e.id === i.timelineEntryId)?.type ?? 'volunteering'))
  const workErrors = validation.errors.some((i) => WORK_TYPES.includes(validation.entries.find((e) => e.id === i.timelineEntryId)?.type ?? 'school'))
  const checks = [
    { ok: validation.openGaps.length === 0, label: t('review.checkGaps') },
    { ok: !eduErrors, label: t('review.checkEdu') },
    { ok: !workErrors, label: t('review.checkWork') },
  ]

  const submit = () => {
    setBusy(true)
    const now = new Date().toISOString()
    updateProfile((p) => ({ ...p, submittedAt: now, auditLog: [...p.auditLog, auditEntry(null, 'submission', null, now, 'candidate', token)] }))
    router.push(`/candidate/${token}/done`)
  }

  return (
    <Page className="pb-40">
      <CandidateHeader back={`/candidate/${token}`} />
      <SaveErrorBanner />
      <h1 className="mt-6 text-[24px] font-bold">{t('review.title')}</h1>
      {helper('review.title') && <p className="mt-1 text-muted">{helper('review.title')}</p>}

      <SectionTitle>{t('review.education')}</SectionTitle>
      <Card><ul className="-my-3.5 divide-y divide-line">{education.map((e) => <Summary key={e.id} entry={e} />)}</ul></Card>

      <SectionTitle>{t('review.work')}</SectionTitle>
      <Card>
        {work.length ? <ul className="-my-3.5 divide-y divide-line">{work.map((e) => <Summary key={e.id} entry={e} />)}</ul> : <p className="text-muted">{t('review.noWork')}</p>}
      </Card>

      {!validation.canSubmit && (
        <>
          <SectionTitle>{t('review.fixFirst')}</SectionTitle>
          <div className="flex flex-col gap-3">
            {validation.openGaps.map((g) => <GapCard key={g.key} gap={g} />)}
            {validation.overlaps.filter((o) => !o.confirmed).map((o) => <OverlapCard key={o.id} overlap={o} entries={validation.entries} />)}
            <FixList issues={validation.errors} entries={validation.entries} />
          </div>
        </>
      )}

      <ul className="mt-7 space-y-2.5">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'flex items-center gap-2 font-semibold text-ok' : 'flex items-center gap-2 font-semibold text-muted'}>
            {c.ok ? <Check /> : <span className="inline-block h-5 w-5 rounded-full border-2 border-[#c4ccca]" aria-hidden />}
            {c.label}
          </li>
        ))}
      </ul>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[520px] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          <p className="mb-2 text-center text-[14px] text-muted">{t('review.confirmText')}</p>
          <Button block disabled={!validation.canSubmit || busy || status !== 'in_progress'} onClick={submit}>
            {busy ? t('review.submitting') : t('review.submit')}
          </Button>
        </div>
      </footer>
    </Page>
  )
}
