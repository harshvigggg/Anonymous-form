'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { useI18n } from '@/i18n'
import { Button, Card, Check, cx, Spinner } from '@/components/ui'
import { useCandidate, type SaveState } from './CandidateProvider'

export function SaveIndicator({ state }: { state: SaveState }) {
  const { t } = useI18n()
  const map: Partial<Record<SaveState, { text: string; cls: string }>> = {
    saving: { text: t('save.saving'), cls: 'text-muted' },
    saved: { text: t('save.saved'), cls: 'text-ok' },
    local: { text: t('save.savedLocal'), cls: 'text-ok' },
  }
  const s = map[state]
  return (
    <span aria-live="polite" className={cx('flex min-h-[20px] items-center gap-1 text-[13px] font-semibold', s?.cls)}>
      {s && (state === 'saving' ? <span className="h-2 w-2 animate-pulse rounded-full bg-muted" aria-hidden /> : <Check className="h-4 w-4" />)}
      {s?.text}
    </span>
  )
}

export function SaveErrorBanner() {
  const { t } = useI18n()
  const { saveState, retrySave } = useCandidate()
  if (saveState !== 'error' && saveState !== 'locked') return null
  return (
    <div role="alert" className="sticky top-[68px] z-10 my-3">
      <Card tone="danger">
        <p className="font-semibold text-danger">{saveState === 'locked' ? t('save.locked') : t('save.error')}</p>
        {saveState === 'error' && (
          <>
            <p className="text-[15px]">{t('save.errorDetail')}</p>
            <Button variant="danger" size="md" className="mt-3" onClick={retrySave}>{t('common.tryAgain')}</Button>
          </>
        )}
      </Card>
    </div>
  )
}

export function CandidateHeader({ back }: { back?: string }) {
  const { t } = useI18n()
  const { saveState } = useCandidate()
  return (
    <header className="sticky top-0 z-20 -mx-4 flex min-h-[64px] items-center gap-3 border-b border-line bg-white/95 px-4 py-2.5 backdrop-blur">
      {back && (
        <Link href={back} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[22px] hover:bg-surface">
          ←
        </Link>
      )}
      <div className="flex-1">
        <p className="text-[17px] font-bold leading-tight">{t('app.title')}</p>
        <p className="text-[13px] text-muted">{t('app.subtitle')}</p>
      </div>
      <SaveIndicator state={saveState} />
    </header>
  )
}

export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('mx-auto min-h-dvh w-full max-w-[520px] px-4', className)}>{children}</div>
}

export function CandidateStateScreen({ state, retry }: { state: 'loading' | 'notfound' | 'error'; retry: () => void }) {
  const { t } = useI18n()
  if (state === 'loading') return <Page><Spinner label={t('common.loading')} /></Page>
  return (
    <Page className="flex flex-col justify-center py-16">
      <div className="text-center">
        <p className="text-[44px]" aria-hidden>{state === 'notfound' ? '🔗' : '📶'}</p>
        <h1 className="mt-2 text-[22px] font-bold">{state === 'notfound' ? t('load.notFound') : t('load.error')}</h1>
        <p className="mt-2 text-muted">{state === 'notfound' ? t('load.notFoundDetail') : t('load.errorDetail')}</p>
        {state === 'error' && <Button className="mt-6" onClick={retry}>{t('common.tryAgain')}</Button>}
      </div>
    </Page>
  )
}
