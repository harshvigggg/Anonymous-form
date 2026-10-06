'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useI18n, durationLabel } from '@/i18n'
import { formatRange } from '@/domain/dates'
import { entryDates, entryEditPath, entryIcons, entrySubtitle, entryTitle } from '@/domain/entries/entries'
import { auditEntry } from '@/domain/timeline/audit'
import type { TimelineEntry, TimelineGap, TimelineOverlap, ValidationIssue } from '@/domain/timeline/types'
import { Badge, Button, ButtonLink, Card, Check, Chevron, cx, Warn } from '@/components/ui'
import { useCandidate } from './CandidateProvider'
import { fixHref, gapHref, issueText } from './fixLinks'

export function EntryCard({ entry, hasErrors }: { entry: TimelineEntry; hasErrors: boolean }) {
  const { t } = useI18n()
  const { token, locked } = useCandidate()
  const draft = entry.status === 'draft'
  const body = (
    <>
      <span className="mt-0.5 text-[24px] leading-none" aria-hidden>{entryIcons[entry.type]}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-bold leading-snug">
          {!draft && !hasErrors && <Check className="h-4 w-4 shrink-0 text-ok" />}
          {!draft && hasErrors && <Warn className="h-4 w-4 shrink-0 text-danger" />}
          <span className="truncate">{entryTitle(entry)}</span>
        </span>
        {entrySubtitle(entry) && entry.type !== 'career_break' && entry.type !== 'volunteering' && (
          <span className="block truncate text-muted">{entrySubtitle(entry)}</span>
        )}
        {entryDates(entry, t('common.present')) && <span className="block text-[15px] text-muted">{entryDates(entry, t('common.present'))}</span>}
        {draft && <span className="mt-1.5 block"><Badge tone="warn">{t('home.unfinished')}</Badge></span>}
        {!draft && hasErrors && <span className="mt-1.5 block"><Badge tone="danger">{t('home.toFix')}</Badge></span>}
      </span>
      {!locked && <Chevron className="mt-1 shrink-0 text-muted" />}
    </>
  )
  const cls = cx(
    'flex w-full items-start gap-3 rounded-[var(--radius-card)] border bg-white p-4 text-left',
    draft ? 'border-warn-line' : hasErrors ? 'border-danger-line' : 'border-line',
  )
  if (locked) return <div className={cls}>{body}</div>
  return <Link href={entryEditPath(token, entry)} className={cx(cls, 'hover:border-brand-line')}>{body}</Link>
}

export function GapCard({ gap }: { gap: TimelineGap }) {
  const { t, helper } = useI18n()
  const { token, locked, validation } = useCandidate()
  return (
    <Card tone="warn">
      <p className="flex items-center gap-2 font-bold text-warn">
        <Warn /> {t('home.needInfo', { duration: durationLabel(t, gap.durationMonthsApprox) })}
      </p>
      <p className="mt-1 text-[20px] font-bold">{formatRange(gap.startDate, gap.endDate, gap.endIsPresent, t('common.present'))}</p>
      {helper('home.needInfo') && <p className="mt-1 text-[15px] text-muted">{helper('home.needInfo')}</p>}
      {!locked && (
        <ButtonLink href={gapHref(token, gap.key, validation.entries)} variant="warn" block className="mt-3">
          {t('home.fixPeriod')}
        </ButtonLink>
      )}
    </Card>
  )
}

export function OverlapCard({ overlap, entries }: { overlap: TimelineOverlap; entries: TimelineEntry[] }) {
  const { t, helper } = useI18n()
  const { token, updateProfile, locked } = useCandidate()
  const [askWhich, setAskWhich] = useState(false)
  const a = entries.find((e) => e.id === overlap.entryIdA)
  const b = entries.find((e) => e.id === overlap.entryIdB)
  if (!a || !b) return null

  const confirm = () =>
    updateProfile((p) => ({
      ...p,
      confirmedOverlaps: { ...p.confirmedOverlaps, [overlap.id]: overlap.signature },
      auditLog: [...p.auditLog, auditEntry(null, 'overlap_confirmed', null, `${entryTitle(a)} + ${entryTitle(b)}`, 'candidate', token)],
    }))

  return (
    <Card tone="warn" className="scroll-mt-24">
      <div id={`overlap-${overlap.id}`} />
      <p className="font-bold">{t('overlap.title')}</p>
      {helper('overlap.title') && <p className="text-[15px] text-muted">{helper('overlap.title')}</p>}
      <ul className="my-3 space-y-2">
        {[a, b].map((e) => (
          <li key={e.id} className="rounded-xl bg-white p-3">
            <p className="font-semibold">{entryIcons[e.type]} {entryTitle(e)}</p>
            <p className="text-[15px] text-muted">{entryDates(e, t('common.present'))}</p>
          </li>
        ))}
      </ul>
      {!locked && !askWhich && (
        <>
          <p className="mb-2 font-semibold">{t('overlap.question')}</p>
          <div className="flex flex-col gap-2">
            <Button variant="secondary" block onClick={confirm}>{t('overlap.yes')}</Button>
            <Button variant="secondary" block onClick={() => setAskWhich(true)}>{t('overlap.no')}</Button>
          </div>
        </>
      )}
      {!locked && askWhich && (
        <>
          <p className="mb-2 font-semibold">{t('overlap.whichWrong')}</p>
          <div className="flex flex-col gap-2">
            {[a, b].map((e) => (
              <ButtonLink key={e.id} variant="secondary" block href={entryEditPath(token, e, 'start')}>
                {entryIcons[e.type]} {entryTitle(e)}
              </ButtonLink>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}

/** Blocking items other than gaps and overlaps (which have their own cards). */
export function FixList({ issues, entries }: { issues: ValidationIssue[]; entries: TimelineEntry[] }) {
  const { t } = useI18n()
  const { token } = useCandidate()
  const list = issues.filter((i) => !i.gapKey && !i.overlapId)
  if (!list.length) return null
  return (
    <Card tone="danger">
      <p className="mb-2 flex items-center gap-2 font-bold text-danger"><Warn /> {t('home.toFix')}</p>
      <ul className="divide-y divide-danger-line">
        {list.map((i) => {
          const { title, message } = issueText(i, t, entries)
          return (
            <li key={i.id}>
              <Link href={fixHref(i, token, entries)} className="flex min-h-[52px] items-center gap-3 py-2.5">
                <span className="flex-1">
                  {title && <span className="block font-semibold">{title}</span>}
                  <span className="block text-[15px]">{message}</span>
                </span>
                <span className="shrink-0 rounded-xl bg-white px-3 py-1.5 text-[15px] font-semibold text-danger">{t('common.fix')}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function TypeCard({ href, icon, title, description }: { href: string; icon: string; title: string; description: string }) {
  return (
    <Link href={href} className="flex min-h-[96px] items-center gap-4 rounded-[var(--radius-card)] border-2 border-line bg-white p-5 hover:border-brand">
      <span className="text-[34px] leading-none" aria-hidden>{icon}</span>
      <span className="flex-1">
        <span className="block text-[19px] font-bold leading-snug">{title}</span>
        <span className="mt-1 block text-[15px] leading-snug text-muted">{description}</span>
      </span>
      <Chevron className="shrink-0 text-muted" />
    </Link>
  )
}
