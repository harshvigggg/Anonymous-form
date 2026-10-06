'use client'

import { Fragment, type ReactNode } from 'react'
import { earliestDay, formatRange } from '@/domain/dates'
import { entryDates, entryIcons, entryLocation, entrySubtitle, entryTitle } from '@/domain/entries/entries'
import type { TimelineEntry, TimelineGap } from '@/domain/timeline/types'
import { cx } from '@/components/ui'
import { useI18n } from '@/i18n'

type Item = { kind: 'entry'; entry: TimelineEntry; start: number } | { kind: 'gap'; gap: TimelineGap; start: number }

const sectionKey: Record<TimelineEntry['type'], string> = {
  school: 'addEdu.school',
  training: 'addEdu.training',
  professional_experience: 'addWork.job',
  career_break: 'addWork.break',
  volunteering: 'addWork.volunteer',
}

/** Vertical cards – easy to read on a small phone. */
export function TimelineVisual({
  entries,
  gaps,
  presentLabel,
  missingLabel,
  renderGapAction,
  overlapIds,
  overlapLabel,
}: {
  entries: TimelineEntry[]
  gaps: TimelineGap[]
  presentLabel: string
  missingLabel: string
  renderGapAction?: (gap: TimelineGap) => ReactNode
  overlapIds?: Set<string>
  overlapLabel?: string
}) {
  const { t } = useI18n()
  const items: Item[] = [
    ...entries.filter((e) => e.status !== 'draft' && e.startDate).map((e) => ({ kind: 'entry' as const, entry: e, start: earliestDay(e.startDate) ?? 0 })),
    ...gaps.map((g) => ({ kind: 'gap' as const, gap: g, start: earliestDay(g.startDate) ?? 0 })),
  ].sort((a, b) => a.start - b.start)

  return (
    <ol className="flex flex-col">
      {items.map((item, i) => (
        <Fragment key={item.kind === 'entry' ? item.entry.id : item.gap.id}>
          {i > 0 && (
            <li aria-hidden className="flex h-7 justify-center text-muted">
              <span className="w-0.5 bg-line" />
            </li>
          )}
          {item.kind === 'entry' ? (
            <li className="rounded-[var(--radius-card)] border border-line bg-white p-4">
              <p className="text-[14px] font-semibold text-brand-dark">{entryDates(item.entry, presentLabel)}</p>
              <p className="mt-0.5 text-[13px] font-semibold uppercase tracking-wide text-muted">{t(sectionKey[item.entry.type])}</p>
              <p className="mt-1 text-[18px] font-bold leading-snug">
                <span aria-hidden>{entryIcons[item.entry.type]} </span>
                {entryTitle(item.entry)}
              </p>
              {item.entry.type !== 'career_break' && item.entry.type !== 'volunteering' && <p className="text-muted">{entrySubtitle(item.entry)}</p>}
              {entryLocation(item.entry) && <p className="text-[15px] text-muted">{entryLocation(item.entry)}</p>}
              {overlapIds?.has(item.entry.id) && overlapLabel && <p className="mt-2 text-[14px] font-semibold text-warn">⇄ {overlapLabel}</p>}
            </li>
          ) : (
            <li
              className={cx(
                'rounded-[var(--radius-card)] border-2 border-dashed p-4',
                item.gap.status === 'ignored_by_admin' ? 'border-line bg-surface' : 'border-warn-line bg-warn-soft',
              )}
            >
              <p className="text-[14px] font-semibold text-warn">{formatRange(item.gap.startDate, item.gap.endDate, item.gap.endIsPresent, presentLabel)}</p>
              <p className="mt-1 font-bold">⚠ {missingLabel}</p>
              {renderGapAction?.(item.gap)}
            </li>
          )}
        </Fragment>
      ))}
    </ol>
  )
}
