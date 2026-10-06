'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm, type FieldPath } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useI18n } from '@/i18n'
import { entryErrors, entrySchemas } from '@/domain/entries/schemas'
import { entryEditPath, entryTitle, newEntry } from '@/domain/entries/entries'
import { auditEntry, diffEntries } from '@/domain/timeline/audit'
import type { AuditLogEntry, OrgName, TimelineEntry } from '@/domain/timeline/types'
import { spellingChanged } from '@/lib/normalization/text'
import { newId } from '@/lib/ids'
import { Button, Card, ProgressBar, Warn } from '@/components/ui'
import { useCandidate } from './CandidateProvider'
import { Page, SaveErrorBanner, SaveIndicator } from './CandidateChrome'
import type { WizardContext, WizardDefinition, WizardStep } from './wizards/types'

const CONFIRM = 'confirm'

/**
 * Generic one-question-per-screen wizard used by all five entry types.
 * Every answer is written to the entry immediately (autosave); the entry
 * stays a "draft" until the candidate confirms it on the last screen.
 */
export function EntryWizard<E extends TimelineEntry>({ definition, entryId }: { definition: WizardDefinition<E>; entryId: string }) {
  const { t, helper } = useI18n()
  const router = useRouter()
  const search = useSearchParams()
  const cand = useCandidate()
  const { token, doc, validation, orgAdditions, uploadEvidence, upsertEntry, deleteEntry, audit, locked, saveState } = cand

  const ctx: WizardContext = useMemo(
    () => ({ token, entries: validation.entries, validation, orgAdditions, uploadEvidence }),
    [token, validation, orgAdditions, uploadEvidence],
  )

  // ----- initial entry -------------------------------------------------------
  const existing = useMemo(
    () => (entryId === 'new' ? undefined : (doc.profile.entries.find((e) => e.id === entryId && e.type === definition.type) as E | undefined)),
    // only on mount – later changes come from this form
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  const [id] = useState(() => existing?.id ?? newId())
  const initial = useMemo<E>(() => {
    if (existing) return existing
    const fresh = newEntry(definition.type, id, doc.id) as E
    return definition.prepare ? definition.prepare(fresh, ctx, new URLSearchParams(search.toString())) : fresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const snapshot = useRef<E>(initial)
  const created = useRef(!!existing)
  const saved = useRef(false)

  const form = useForm<E>({
    defaultValues: initial as never,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(entrySchemas[definition.type] as any),
  })
  const values = form.watch() as E

  // ----- autosave ------------------------------------------------------------
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistNow = useCallback(
    (extra?: Partial<E>) => {
      if (persistTimer.current) clearTimeout(persistTimer.current)
      persistTimer.current = null
      const current = { ...(form.getValues() as E), ...extra, updatedAt: new Date().toISOString() } as E
      if (!created.current) {
        created.current = true
        current.status = 'draft'
        // Keep the URL pointing at this entry so a refresh resumes it.
        if (entryId === 'new') window.history.replaceState(null, '', entryEditPath(token, current))
      }
      upsertEntry(current)
    },
    [form, upsertEntry, entryId, token],
  )
  const schedulePersist = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = setTimeout(() => persistNow(), 300)
  }, [persistNow])

  const set = useCallback(
    (patchOrFn: Partial<E> | ((latest: E) => Partial<E>)) => {
      const patch = typeof patchOrFn === 'function' ? patchOrFn(form.getValues() as E) : patchOrFn
      for (const [k, v] of Object.entries(patch)) {
        form.setValue(k as FieldPath<E>, v as never, { shouldDirty: true, shouldValidate: false })
      }
      schedulePersist()
    },
    [form, schedulePersist],
  )

  // ----- steps -----------------------------------------------------------------
  const visible = useMemo(() => definition.steps.filter((s) => !s.visible || s.visible(values, ctx)), [definition.steps, values, ctx])
  const issues = useMemo(() => entryErrors(values), [values])
  const issueFields = useMemo(() => new Set(issues.map((i) => i.field)), [issues])

  const [stepId, setStepId] = useState<string>(() => {
    const requested = search.get('step')
    const vis = definition.steps.filter((s) => !s.visible || s.visible(initial, ctx))
    if (requested && (requested === CONFIRM || vis.some((s) => s.id === requested))) return requested
    if (existing && existing.status !== 'draft') return CONFIRM
    if (existing?.wizardStep && (existing.wizardStep === CONFIRM || vis.some((s) => s.id === existing.wizardStep))) return existing.wizardStep
    return vis[0]?.id ?? CONFIRM
  })
  const [fromSummary, setFromSummary] = useState(() => !!search.get('step') && !!existing && existing.status !== 'draft')
  const [attempted, setAttempted] = useState<Record<string, boolean>>({})

  // If the current screen became hidden (an earlier answer changed), move to the next relevant one.
  const effectiveId = useMemo(() => {
    if (stepId === CONFIRM || visible.some((s) => s.id === stepId)) return stepId
    const from = definition.steps.findIndex((s) => s.id === stepId)
    return visible.find((s) => definition.steps.indexOf(s) >= from)?.id ?? CONFIRM
  }, [stepId, visible, definition.steps])
  const index = visible.findIndex((s) => s.id === effectiveId)
  const step: WizardStep<E> | undefined = index >= 0 ? visible[index] : undefined
  const isConfirm = effectiveId === CONFIRM || !step
  const total = visible.length + 1
  const position = isConfirm ? total : index + 1

  const topRef = useRef<HTMLDivElement>(null)
  const go = useCallback(
    (target: string) => {
      setStepId(target)
      if (created.current && (form.getValues() as E).status === 'draft') persistNow({ wizardStep: target } as Partial<E>)
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0 })
        topRef.current?.focus({ preventScroll: true })
      })
    },
    [form, persistNow],
  )

  const stepProblems = (s: WizardStep<E>) => {
    const own = issues.filter((i) => s.fields.includes(i.field))
    const extra = s.check?.(values, ctx)
    return { own, extra }
  }

  const next = useCallback(async () => {
    if (!step) return
    const ok = await form.trigger(step.fields as FieldPath<E>[])
    const extra = step.check?.(form.getValues() as E, ctx)
    if (!ok || extra) {
      setAttempted((a) => ({ ...a, [step.id]: true }))
      return
    }
    const errs = new Set(entryErrors(form.getValues() as E).map((i) => i.field))
    let target: string
    if (fromSummary) {
      target = visible.slice(index + 1).find((s) => s.fields.some((f) => errs.has(f)) || s.check?.(form.getValues() as E, ctx))?.id ?? CONFIRM
    } else target = visible[index + 1]?.id ?? CONFIRM
    go(target)
  }, [step, form, ctx, fromSummary, visible, index, go])

  const nextRef = useRef(next)
  nextRef.current = next

  const back = () => {
    if (isConfirm) {
      if (visible.length) go(visible[visible.length - 1].id)
      else router.push(definition.backPath(token))
    } else if (fromSummary) go(CONFIRM)
    else if (index > 0) go(visible[index - 1].id)
    else router.push(created.current ? `/candidate/${token}` : definition.backPath(token))
  }

  // ----- audit helpers ------------------------------------------------------------
  const buildAudit = useCallback(
    (final: E): AuditLogEntry[] => {
      const out: AuditLogEntry[] = []
      const before = snapshot.current
      const wasDraft = !existing || existing.status === 'draft'
      if (wasDraft) out.push(auditEntry(final.id, 'entry_created', null, entryTitle(final), 'candidate', token))
      else for (const d of diffEntries(before, final)) out.push(auditEntry(final.id, d.field, d.from, d.to, 'candidate', token))
      for (const field of ['institution', 'facility'] as const) {
        const org = (final as unknown as Record<string, OrgName | null>)[field]
        const prev = (before as unknown as Record<string, OrgName | null>)[field]
        if (org && org.source === 'candidate' && spellingChanged(org.rawValue, org.normalizedValue) && (wasDraft || prev?.rawValue !== org.rawValue)) {
          out.push(auditEntry(final.id, `${field}_normalized`, org.rawValue, org.normalizedValue, 'system', 'normalizer'))
        }
      }
      return out
    },
    [existing, token],
  )

  // Record edits made to a confirmed entry even if the candidate leaves without "Save".
  const latest = useRef(values)
  latest.current = values
  useEffect(
    () => () => {
      if (persistTimer.current) {
        clearTimeout(persistTimer.current)
        persistNow()
      }
      if (!saved.current && existing && existing.status !== 'draft') {
        const diffs = diffEntries(snapshot.current, latest.current)
        if (diffs.length) audit(diffs.map((d) => auditEntry(existing.id, d.field, d.from, d.to, 'candidate', token)))
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const save = async () => {
    const ok = await form.trigger()
    const current = form.getValues() as E
    const errs = entryErrors(current)
    const firstBad = visible.find((s) => s.fields.some((f) => errs.some((e) => e.field === f)) || s.check?.(current, ctx))
    if (!ok || firstBad) {
      if (firstBad) {
        setAttempted((a) => ({ ...a, [firstBad.id]: true }))
        setFromSummary(true)
        go(firstBad.id)
      }
      return
    }
    const final = { ...current, status: 'complete', wizardStep: null, updatedAt: new Date().toISOString() } as E
    created.current = true
    saved.current = true
    upsertEntry(final)
    audit(buildAudit(final))
    router.push(`/candidate/${token}?saved=1`)
  }

  const remove = () => {
    if (!window.confirm(t('wizard.deleteConfirm'))) return
    saved.current = true
    if (persistTimer.current) clearTimeout(persistTimer.current)
    persistTimer.current = null
    if (created.current) deleteEntry(id)
    router.push(`/candidate/${token}`)
  }

  // ----- render ------------------------------------------------------------------
  if (locked) {
    return (
      <Page className="py-16 text-center">
        <p className="text-[40px]" aria-hidden>🔒</p>
        <p className="mt-3 font-semibold">{t('wizard.locked')}</p>
        <Button className="mt-6" onClick={() => router.push(`/candidate/${token}`)}>{t('common.home')}</Button>
      </Page>
    )
  }

  const problems = step ? stepProblems(step) : null
  const showErrors = step && attempted[step.id] && problems && (problems.own.length > 0 || problems.extra)

  return (
    <Page className="pb-40">
      <header className="sticky top-0 z-20 -mx-4 border-b border-line bg-white/95 px-4 pb-3 pt-2 backdrop-blur">
        <div className="flex min-h-[48px] items-center gap-2">
          <button type="button" onClick={back} aria-label={t('common.back')} className="-ml-2 flex h-11 w-11 items-center justify-center rounded-full text-[22px] hover:bg-surface">
            ←
          </button>
          <div className="flex-1">
            <p className="font-bold leading-tight">{t(`wizard.title.${definition.type}`)}</p>
            <p className="text-[14px] text-muted">{t('wizard.step', { current: position, total })}</p>
          </div>
          <SaveIndicator state={saveState} />
        </div>
        <ProgressBar value={(position / total) * 100} label={t('wizard.step', { current: position, total })} />
      </header>

      <SaveErrorBanner />

      <div ref={topRef} tabIndex={-1} className="pt-5 outline-none">
        {step && !isConfirm ? (
          <section aria-labelledby={`q-${step.id}`}>
            {step.intro?.(values, ctx, t)}
            <h1 id={`q-${step.id}`} className="text-[22px] font-bold leading-snug">
              {t(step.question, step.questionParams?.(values, ctx))}
            </h1>
            {helper(step.question) && <p className="mt-1 text-[16px] text-muted">{helper(step.question)}</p>}
            {step.help && <p className="mt-2 text-[15px] text-muted">{t(step.help, step.helpParams?.(values, ctx))}</p>}
            <div className="mt-5">{step.render({ values, set, next: () => setTimeout(() => void nextRef.current(), 180), t, ctx })}</div>

            {showErrors && (
              <div role="alert" className="mt-5 rounded-2xl border border-danger-line bg-danger-soft p-4 text-danger">
                {problems!.own.map((i) => (
                  <p key={i.field + i.code} className="flex gap-2 font-semibold"><Warn className="mt-0.5 shrink-0" />{t(i.message, { ...i.params, field: t(`field.${i.field}`) })}</p>
                ))}
                {problems!.extra && <p className="flex gap-2 font-semibold"><Warn className="mt-0.5 shrink-0" />{t(problems!.extra)}</p>}
              </div>
            )}
          </section>
        ) : (
          <ConfirmScreen
            definition={definition}
            values={values}
            ctx={ctx}
            issues={issues.length > 0}
            onChange={(s) => {
              if (s.reveal) set(s.reveal)
              setFromSummary(true)
              go(s.id)
            }}
            onDelete={created.current ? remove : undefined}
          />
        )}
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[520px] flex-col gap-2 px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
          {step && !isConfirm && step.skip && (
            <Button variant="ghost" size="md" onClick={() => { set(step.skip!); setTimeout(() => go(visible[index + 1]?.id ?? CONFIRM), 0) }}>
              {t('common.skip')}
            </Button>
          )}
          <div className="flex gap-3">
            <Button variant="secondary" onClick={back} className="w-[34%]">{t('common.back')}</Button>
            {isConfirm ? (
              <Button className="flex-1" onClick={() => void save()}>{t('common.save')}</Button>
            ) : (
              <Button className="flex-1" onClick={() => void next()}>{t('common.next')} →</Button>
            )}
          </div>
        </div>
      </footer>
    </Page>
  )
}

function ConfirmScreen<E extends TimelineEntry>({
  definition,
  values,
  ctx,
  issues,
  onChange,
  onDelete,
}: {
  definition: WizardDefinition<E>
  values: E
  ctx: WizardContext
  issues: boolean
  onChange: (s: WizardStep<E>) => void
  onDelete?: () => void
}) {
  const { t, helper } = useI18n()
  const rows = definition.steps.filter((s) => s.summary && (s.summaryWhenHidden || !s.visible || s.visible(values, ctx)))
  return (
    <section aria-labelledby="confirm-title">
      <h1 id="confirm-title" className="text-[22px] font-bold">{t('wizard.confirm')}</h1>
      {helper('wizard.confirm') && <p className="mt-1 text-muted">{helper('wizard.confirm')}</p>}
      <p className="mt-1 text-[15px] text-muted">{t('wizard.confirmHelp')}</p>

      {issues && (
        <Card tone="danger" className="mt-4">
          <p className="font-semibold text-danger">{t('wizard.fixBelow')}</p>
        </Card>
      )}

      <dl className="mt-5 divide-y divide-line overflow-hidden rounded-[var(--radius-card)] border border-line">
        {rows.map((s) => {
          const v = s.summary!(values, ctx, t)
          const empty = v === null || v === undefined || v === ''
          return (
            <div key={s.id} className="flex items-start gap-3 px-4 py-3.5">
              <div className="min-w-0 flex-1">
                <dt className="text-[14px] font-semibold text-muted">{t(s.summaryLabel ?? s.question)}</dt>
                <dd className={empty ? 'font-semibold text-danger' : 'font-semibold break-words'}>{empty ? t('common.notAnswered') : v}</dd>
              </div>
              <button type="button" onClick={() => onChange(s)} className="min-h-[44px] shrink-0 rounded-xl px-3 font-semibold text-brand-dark hover:bg-brand-soft">
                {t('common.change')}
              </button>
            </div>
          )
        })}
      </dl>

      {onDelete && (
        <button type="button" onClick={onDelete} className="mt-6 min-h-[44px] w-full rounded-xl font-semibold text-danger hover:bg-danger-soft">
          {t('wizard.deleteEntry')}
        </button>
      )}
    </section>
  )
}
