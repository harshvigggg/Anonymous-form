'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useI18n } from '@/i18n'
import { earliestDay } from '@/domain/dates'
import { EDUCATION_TYPES, WORK_TYPES } from '@/domain/entries/entries'
import { profileProgress } from '@/domain/timeline/quality'
import { auditEntry } from '@/domain/timeline/audit'
import type { TimelineEntry } from '@/domain/timeline/types'
import { Button, ButtonLink, Card, Check, ProgressBar, SectionTitle, Toast } from '@/components/ui'
import { useCandidate } from '@/components/candidate/CandidateProvider'
import { CandidateHeader, Page, SaveErrorBanner } from '@/components/candidate/CandidateChrome'
import { EntryCard, FixList, GapCard, OverlapCard } from '@/components/candidate/HomeParts'

function byStart(a: TimelineEntry, b: TimelineEntry) {
  if (a.status === 'draft' && b.status !== 'draft') return 1
  if (b.status === 'draft' && a.status !== 'draft') return -1
  return (earliestDay(a.startDate) ?? Infinity) - (earliestDay(b.startDate) ?? Infinity)
}

function Welcome() {
  const { t, helper } = useI18n()
  const { doc, updateProfile } = useCandidate()
  const first = doc.fullName.split(' ')[0]
  return (
    <Page className="flex flex-col pb-10 pt-10">
      <p className="text-[15px] font-semibold text-brand-dark">{t('app.title')}</p>
      <h1 className="mt-6 text-[28px] font-bold leading-tight">{first ? t('welcome.hello', { name: first }) : t('welcome.helloNoName')}</h1>
      <p className="mt-3 text-[22px] font-bold leading-snug">{t('welcome.title')}</p>
      {helper('welcome.title') && <p className="mt-2 text-muted">{helper('welcome.title')}</p>}
      <p className="mt-4">{t('welcome.text')}</p>
      <ul className="mt-6 space-y-3">
        {['welcome.point1', 'welcome.point2', 'welcome.point3', 'welcome.point4'].map((k) => (
          <li key={k} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"><Check className="h-4 w-4" /></span>
            <span>
              {t(k)}
              {helper(k) && <span className="block text-[15px] text-muted">{helper(k)}</span>}
            </span>
          </li>
        ))}
      </ul>
      <Button block className="mt-10" onClick={() => updateProfile((p) => ({ ...p, welcomeSeen: true }))}>
        {t('welcome.start')} →
      </Button>
    </Page>
  )
}

function Home() {
  const { t } = useI18n()
  const router = useRouter()
  const search = useSearchParams()
  const { token, doc, validation, status, locked, updateProfile } = useCandidate()
  const [toast, setToast] = useState(false)

  useEffect(() => {
    if (search.get('saved')) {
      setToast(true)
      router.replace(`/candidate/${token}`, { scroll: false })
      const id = setTimeout(() => setToast(false), 2200)
      return () => clearTimeout(id)
    }
  }, [search, router, token])

  useEffect(() => {
    if (window.location.hash.startsWith('#overlap-')) document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [])

  const entries = validation.entries
  const education = useMemo(() => entries.filter((e) => EDUCATION_TYPES.includes(e.type)).sort(byStart), [entries])
  const work = useMemo(() => entries.filter((e) => WORK_TYPES.includes(e.type)).sort(byStart), [entries])
  const errorEntryIds = new Set(validation.errors.map((i) => i.timelineEntryId).filter(Boolean))
  const openOverlaps = validation.overlaps.filter((o) => !o.confirmed)
  const progress = profileProgress(validation)

  if (!doc.profile.welcomeSeen && entries.length === 0) return <Welcome />

  const reopened = status === 'in_progress' && !!doc.review.reopenedAt && !!doc.profile.submittedAt

  return (
    <Page className="pb-36">
      <CandidateHeader />
      <SaveErrorBanner />

      <Card className="mt-4">
        {doc.fullName && <p className="text-[20px] font-bold">{doc.fullName}</p>}
        {progress === 100 ? (
          <p className="mt-1 flex items-center gap-1.5 font-semibold text-ok"><Check /> {t('home.ready')}</p>
        ) : (
          <p className="mt-1 font-semibold text-muted">{t('home.progress', { percent: progress })}</p>
        )}
        <div className="mt-3"><ProgressBar value={progress} label={t('home.progress', { percent: progress })} /></div>
      </Card>

      {status === 'submitted' && (
        <Card tone="ok" className="mt-4">
          <p className="font-bold text-ok">{t('home.submittedTitle')}</p>
          <p className="mt-1">{t('home.submittedText')}</p>
        </Card>
      )}
      {status === 'verified' && (
        <Card tone="ok" className="mt-4">
          <p className="font-bold text-ok">{t('home.verifiedTitle')}</p>
          <p className="mt-1">{t('home.verifiedText')}</p>
        </Card>
      )}
      {reopened && (
        <Card tone="warn" className="mt-4">
          <p className="font-bold text-warn">{t('home.reopenedTitle')}</p>
          {doc.review.reopenNote && <p className="mt-1">{doc.review.reopenNote}</p>}
        </Card>
      )}

      <SectionTitle>{t('home.education')}</SectionTitle>
      <div className="flex flex-col gap-2.5">
        {education.map((e) => <EntryCard key={e.id} entry={e} hasErrors={errorEntryIds.has(e.id)} />)}
        {education.length === 0 && <p className="text-muted">{t('home.emptyEducation')}</p>}
        {!locked && <ButtonLink href={`/candidate/${token}/education/new`} variant="secondary" block>{t('home.addEducation')}</ButtonLink>}
      </div>

      <SectionTitle>{t('home.work')}</SectionTitle>
      <div className="flex flex-col gap-2.5">
        {work.map((e) => <EntryCard key={e.id} entry={e} hasErrors={errorEntryIds.has(e.id)} />)}
        {work.length === 0 && <p className="text-muted">{t('home.emptyWork')}</p>}
        {!locked && <ButtonLink href={`/candidate/${token}/experience/new`} variant="secondary" block>{t('home.addWork')}</ButtonLink>}
      </div>

      <SectionTitle action={entries.length > 0 ? <Link href={`/candidate/${token}/timeline`} className="flex min-h-[44px] items-center text-[15px] font-semibold text-brand-dark underline underline-offset-4">{t('home.viewTimeline')}</Link> : undefined}>
        {t('home.timeline')}
      </SectionTitle>
      <div className="flex flex-col gap-3">
        {entries.some((e) => e.status !== 'draft') && validation.openGaps.length === 0 && (
          <Card tone="ok"><p className="flex items-center gap-2 font-semibold text-ok"><Check /> {t('home.timelineOk')}</p></Card>
        )}
        {validation.openGaps.map((g) => <GapCard key={g.key} gap={g} />)}
        {openOverlaps.map((o) => <OverlapCard key={o.id} overlap={o} entries={entries} />)}
        <FixList issues={validation.errors} entries={entries} />
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto w-full max-w-[520px] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {status === 'in_progress' ? (
            <>
              <Button block disabled={!validation.canSubmit} onClick={() => router.push(`/candidate/${token}/review`)}>
                {t('home.review')}
              </Button>
              {!validation.canSubmit && <p className="mt-1.5 text-center text-[14px] text-muted">{t('home.reviewLocked')}</p>}
            </>
          ) : status === 'submitted' ? (
            <Button
              variant="secondary"
              block
              onClick={() => {
                if (!window.confirm(t('home.editAfterSubmitConfirm'))) return
                updateProfile((p) => ({ ...p, submittedAt: null, auditLog: [...p.auditLog, auditEntry(null, 'submission', p.submittedAt, null, 'candidate', token)] }))
              }}
            >
              {t('home.editAfterSubmit')}
            </Button>
          ) : (
            <ButtonLink href={`/candidate/${token}/timeline`} variant="secondary" block>{t('home.viewTimeline')}</ButtonLink>
          )}
        </div>
      </footer>

      {toast && <Toast>{t('home.savedToast')}</Toast>}
    </Page>
  )
}

export default function CandidateHomePage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  )
}
