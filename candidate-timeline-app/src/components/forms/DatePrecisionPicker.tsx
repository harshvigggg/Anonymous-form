'use client'

import { useEffect, useId, useState } from 'react'
import { useI18n } from '@/i18n'
import { daysInMonth, MONTHS_LONG, parseDate, toValue, today, type DatePrecision } from '@/domain/dates'
import { entryRules } from '@/config/validationRules'
import { cx } from '@/components/ui'

type Mode = 'day' | 'month' | 'year'

/**
 * Month + year by default, with "I don't remember the exact month" (year only)
 * and "I know the exact date" (day). Uses native selects – reliable on every
 * Android browser. Stores the value and its precision separately and never
 * invents a day or month.
 */
export function DatePrecisionPicker({
  value,
  onChange,
  defaultMode = 'month',
  allowYearOnly = true,
  allowDay = true,
  minYear = entryRules.minYear,
  label,
}: {
  value: string | null
  onChange: (value: string | null, precision: DatePrecision) => void
  defaultMode?: Mode
  allowYearOnly?: boolean
  allowDay?: boolean
  minYear?: number
  label: string
}) {
  const { t, helper } = useI18n()
  const parsed = parseDate(value)
  const [mode, setMode] = useState<Mode>(() => (parsed ? (parsed.d ? 'day' : parsed.m ? 'month' : 'year') : defaultMode))
  const [y, setY] = useState<number | ''>(parsed?.y ?? '')
  const [m, setM] = useState<number | ''>(parsed?.m ?? '')
  const [d, setD] = useState<number | ''>(parsed?.d ?? '')
  const ids = { d: useId(), m: useId(), y: useId() }

  const now = today()
  const years: number[] = []
  for (let yr = now.y; yr >= minYear; yr--) years.push(yr)
  const maxDay = y && m ? daysInMonth(y, m) : 31

  // Keep the day valid when the month changes (e.g. 31 → February).
  useEffect(() => {
    if (d && d > maxDay) setD(maxDay)
  }, [d, maxDay])

  // Report a value only when every part needed for the chosen precision is selected.
  useEffect(() => {
    let next: string | null = null
    if (y && mode === 'year') next = toValue(y)
    if (y && m && mode === 'month') next = toValue(y, m)
    if (y && m && d && mode === 'day') next = toValue(y, m, Math.min(d, maxDay))
    if (next !== value) onChange(next, next ? mode : 'unknown')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [y, m, d, mode])

  const select = 'min-h-[52px] w-full rounded-2xl border-2 border-line bg-white px-3 text-[17px] outline-none focus:border-brand'

  return (
    <div role="group" aria-label={label}>
      <div className={cx('grid gap-2.5', mode === 'day' ? 'grid-cols-[0.8fr_1.4fr_1fr]' : mode === 'month' ? 'grid-cols-[1.4fr_1fr]' : 'grid-cols-1')}>
        {mode === 'day' && (
          <div>
            <label htmlFor={ids.d} className="mb-1 block text-[14px] font-semibold text-muted">{t('date.day')}</label>
            <select id={ids.d} className={select} value={d} onChange={(e) => setD(e.target.value ? Number(e.target.value) : '')}>
              <option value="">–</option>
              {Array.from({ length: maxDay }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}
        {mode !== 'year' && (
          <div>
            <label htmlFor={ids.m} className="mb-1 block text-[14px] font-semibold text-muted">{t('date.month')}</label>
            <select id={ids.m} className={select} value={m} onChange={(e) => setM(e.target.value ? Number(e.target.value) : '')}>
              <option value="">–</option>
              {MONTHS_LONG.map((name, i) => (
                <option key={name} value={i + 1}>{name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label htmlFor={ids.y} className="mb-1 block text-[14px] font-semibold text-muted">{t('date.year')}</label>
          <select id={ids.y} className={select} value={y} onChange={(e) => setY(e.target.value ? Number(e.target.value) : '')}>
            <option value="">–</option>
            {years.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      {mode === 'year' && <p className="mt-2 text-[15px] text-muted">{t('date.yearOnlyNote')}</p>}

      <div className="mt-4 flex flex-col items-start gap-1">
        {mode === 'month' && allowYearOnly && (
          <ModeLink onClick={() => setMode('year')} hint={helper('date.noMonth')}>{t('date.noMonth')}</ModeLink>
        )}
        {mode === 'month' && allowDay && <ModeLink onClick={() => setMode('day')}>{t('date.exact')}</ModeLink>}
        {mode === 'year' && <ModeLink onClick={() => setMode('month')}>{t('date.knowMonth')}</ModeLink>}
        {mode === 'day' && <ModeLink onClick={() => setMode('month')}>{t('date.noDay')}</ModeLink>}
      </div>
    </div>
  )
}

function ModeLink({ onClick, children, hint }: { onClick: () => void; children: React.ReactNode; hint?: string }) {
  return (
    <button type="button" onClick={onClick} className="min-h-[44px] text-left">
      <span className="font-semibold text-brand-dark underline decoration-brand-line decoration-2 underline-offset-4">{children}</span>
      {hint && <span className="block text-[14px] text-muted">{hint}</span>}
    </button>
  )
}
