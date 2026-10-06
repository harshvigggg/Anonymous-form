'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { t as tr } from '@/i18n'
import { qualityWeights } from '@/config/validationRules'
import type { MasterOrg } from '@/config/institutions'
import { candidateStatus } from '@/domain/timeline/review'
import { validateProfile } from '@/domain/timeline/validators'
import { profileQuality } from '@/domain/timeline/quality'
import { auditEntry } from '@/domain/timeline/audit'
import { entryTitle } from '@/domain/entries/entries'
import type { CandidateDoc, ExecutiveReview, OrgName, TimelineEntry, ValidationIssue } from '@/domain/timeline/types'
import { adminRepository } from '@/lib/database/repository'
import { fetchOrgAdditions, type ClientConfig } from '@/lib/database/api'
import { localStore } from '@/lib/database/localStore'
import { exportCandidate } from '@/lib/export'
import { AdminGate, AdminHeader, statusBadge, useExecName } from '@/components/admin/AdminShell'
import { ReviewWarningCard, type ReviewActions } from '@/components/admin/ReviewWarningCard'
import { TimelineVisual } from '@/components/timeline/TimelineVisual'
import { Badge, Button, Card, ProgressBar } from '@/components/ui'

const qualityLabels: Record<keyof typeof qualityWeights, string> = {
  timelineCompleteness: 'Timeline completeness',
  requiredFields: 'Required fields',
  verifiedInstitutions: 'Verified institutions',
  verifiedEmployers: 'Verified employers',
  dateConfidence: 'Date confidence',
  warnings: 'Open warnings',
}

/** Group issues that are about the same thing so the executive acts once. */
function groupIssues(issues: ValidationIssue[]): ValidationIssue[][] {
  const groups = new Map<string, ValidationIssue[]>()
  for (const i of issues) {
    const orgField = i.field === 'institution' || i.field === 'facility'
    const key = orgField ? `${i.timelineEntryId}:${i.field}` : i.id
    groups.set(key, [...(groups.get(key) ?? []), i])
  }
  return [...groups.values()]
}

function Review({ cfg, id }: { cfg: ClientConfig; id: string }) {
  const [doc, setDoc] = useState<CandidateDoc | null | undefined>(undefined)
  const [additions, setAdditions] = useState<MasterOrg[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [reopenNote, setReopenNote] = useState('')
  const [execName] = useExecName()
  const by = execName.trim() || 'executive'

  const load = useCallback(() => {
    adminRepository.get(id).then(setDoc).catch((e: Error) => setError(e.message))
    ;(cfg.remote ? fetchOrgAdditions() : Promise.resolve(localStore.orgs())).then(setAdditions).catch(() => {})
  }, [id, cfg.remote])
  useEffect(load, [load])

  const validation = useMemo(() => (doc ? validateProfile(doc.profile, doc.review, { candidateId: doc.id }) : null), [doc])
  const quality = useMemo(() => (validation ? profileQuality(validation) : null), [validation])

  const saveReview = useCallback(
    async (mutate: (r: ExecutiveReview) => ExecutiveReview) => {
      if (!doc) return
      const review = { ...mutate(doc.review), updatedAt: new Date().toISOString() }
      setDoc({ ...doc, review })
      setSaving(true)
      try {
        await adminRepository.saveReview(doc, review)
        setError(null)
      } catch (e) {
        setError(`Could not save: ${(e as Error).message}`)
      } finally {
        setSaving(false)
      }
    },
    [doc],
  )

  const actions: ReviewActions = useMemo(
    () => ({
      accept: (issues, note) =>
        void saveReview((r) => {
          const at = new Date().toISOString()
          const decisions = { ...r.issueDecisions }
          for (const i of issues) decisions[i.id] = { status: 'accepted_by_admin', at, by, note }
          return {
            ...r,
            issueDecisions: decisions,
            auditLog: [...r.auditLog, ...issues.map((i) => auditEntry(i.timelineEntryId ?? null, `accepted:${i.code}`, null, note ?? 'accepted', 'executive', by, at))],
          }
        }),
      override: (entry, patch, resolves, log) =>
        void saveReview((r) => {
          const at = new Date().toISOString()
          const prev = r.entryOverrides[entry.id]
          const base = prev && entry.updatedAt <= prev.at ? prev : { at, by }
          return {
            ...r,
            entryOverrides: { ...r.entryOverrides, [entry.id]: { ...base, ...patch, at, by } },
            auditLog: [...r.auditLog, auditEntry(entry.id, log.field, log.from, log.to, 'executive', by, at)],
            issueDecisions: Object.fromEntries(Object.entries(r.issueDecisions).filter(([k]) => !resolves.some((i) => i.id === k))),
          }
        }),
      addOrg: (org) => {
        adminRepository.addOrg(org).then(() => setAdditions((a) => [...a.filter((x) => x.id !== org.id), org])).catch(() => setError('Could not add to the verified list'))
      },
    }),
    [saveReview, by],
  )

  if (doc === undefined) return <p className="p-6 text-muted">Loading…</p>
  if (!doc || !validation || !quality) return <p className="p-6">Candidate not found. <Link className="underline" href="/admin">Back</Link></p>

  const status = candidateStatus(doc)
  const entries = validation.entries
  const entryOf = (i: ValidationIssue) => entries.find((e) => e.id === i.timelineEntryId)
  const gapOf = (i: ValidationIssue) => validation.gaps.find((g) => g.key === i.gapKey)
  const acceptableErrors = validation.errors.filter((i) => i.code === 'UNRESOLVED_TIMELINE_GAP' || i.code === 'TIMELINE_OVERLAP')
  const otherErrors = validation.errors.filter((i) => !acceptableErrors.includes(i))
  const reviewItems = validation.warnings.length + validation.errors.length
  const canApprove = validation.errors.length === 0 && validation.warnings.length === 0 && status === 'submitted'

  const orgRows = entries.flatMap((e) => {
    const org = (e as unknown as Record<string, OrgName | null>)[e.type === 'professional_experience' ? 'facility' : 'institution']
    return org && (e.type === 'training' || e.type === 'school' || e.type === 'professional_experience') ? [{ e, org }] : []
  })
  const evidence = entries.flatMap((e) => (e.type === 'training' && e.evidence ? [{ e, file: e.evidence }] : []))
  const audit = [...doc.profile.auditLog, ...doc.review.auditLog].sort((a, b) => b.changedAt.localeCompare(a.changedAt))

  const download = () => {
    const blob = new Blob([JSON.stringify(exportCandidate(doc, entries), null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(doc.fullName || 'candidate').replace(/\s+/g, '_')}_timeline.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <AdminHeader cfg={cfg}>
        {saving && <span className="text-[14px] text-muted">Saving…</span>}
        <Button size="sm" variant="secondary" onClick={download}>Export for target system</Button>
      </AdminHeader>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Link href="/admin" className="text-[15px] font-semibold text-brand-dark">← All candidates</Link>
        {error && <Card tone="danger" className="mt-3"><p className="text-danger">{error}</p></Card>}

        {/* Summary + quality */}
        <div className="mt-3 grid gap-4 md:grid-cols-[1fr_320px]">
          <Card>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="mr-auto text-[24px] font-bold">{doc.fullName || 'Unnamed candidate'}</h1>
              <Badge tone={statusBadge[status].tone}>{statusBadge[status].label}</Badge>
            </div>
            <p className="mt-1 text-[15px] text-muted">
              {doc.phone && <>{doc.phone} · </>}Created {new Date(doc.createdAt).toLocaleDateString()}
              {doc.profile.submittedAt && <> · Submitted {new Date(doc.profile.submittedAt).toLocaleString()}</>}
            </p>
            <p className="mt-4 text-[20px] font-bold">{reviewItems === 0 ? '✓ Nothing needs review' : `${reviewItems} item${reviewItems === 1 ? ' needs' : 's need'} review`}</p>
            <p className="text-[15px] text-muted">Only exceptions are listed below – no need to reread the whole profile.</p>
          </Card>
          <Card>
            <p className="text-[14px] font-semibold text-muted">Profile Quality</p>
            <p className="text-[36px] font-bold leading-none">{quality.total}<span className="text-[18px] text-muted">/100</span></p>
            <ul className="mt-3 space-y-2">
              {quality.parts.map((p) => (
                <li key={p.key}>
                  <div className="flex justify-between text-[13px]"><span>{qualityLabels[p.key]}</span><span className="text-muted">{Math.round(p.score)}/{p.max}</span></div>
                  <ProgressBar value={(p.score / p.max) * 100} label={qualityLabels[p.key]} />
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Blocking */}
        {validation.errors.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-2 text-[18px] font-bold">Blocking errors</h2>
            <p className="mb-3 text-[15px] text-muted">
              {status === 'in_progress' ? 'The candidate cannot submit yet.' : 'These must be fixed before approval.'} Gaps and overlaps can be accepted by an executive; everything else must be fixed by the candidate.
            </p>
            <div className="flex flex-col gap-3">
              {acceptableErrors.map((i) => <ReviewWarningCard key={i.id} issues={[i]} gap={gapOf(i)} actions={actions} additions={additions} />)}
              {otherErrors.length > 0 && (
                <Card tone="danger">
                  <ul className="list-disc space-y-1 pl-5">
                    {otherErrors.map((i) => {
                      const e = entryOf(i)
                      return <li key={i.id}>{e && <strong>{entryTitle(e)}: </strong>}{tr(i.message, { ...i.params, field: i.field ? tr(`field.${i.field}`) : '' })}</li>
                    })}
                  </ul>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Warnings */}
        <section className="mt-8">
          <h2 className="mb-3 text-[18px] font-bold">Items to review {validation.warnings.length > 0 && <span className="text-muted">({validation.warnings.length})</span>}</h2>
          {validation.warnings.length === 0 ? (
            <Card tone="ok"><p className="font-semibold text-ok">No open warnings.</p></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {groupIssues(validation.warnings).map((g) => (
                <ReviewWarningCard key={g[0].id} issues={g} entry={entryOf(g[0])} actions={actions} additions={additions} />
              ))}
            </div>
          )}
          {validation.accepted.length > 0 && (
            <details className="mt-3">
              <summary className="min-h-[44px] cursor-pointer py-2 font-semibold text-muted">Accepted by executive ({validation.accepted.length})</summary>
              <ul className="space-y-1 pl-4 text-[15px]">
                {validation.accepted.map((i) => (
                  <li key={i.id}>
                    {tr(i.message, { ...i.params, field: i.field ? tr(`field.${i.field}`) : '' })}
                    {entryOf(i) && <> – {entryTitle(entryOf(i)!)}</>} · {doc.review.issueDecisions[i.id]?.by}
                    {doc.review.issueDecisions[i.id]?.note && <> · “{doc.review.issueDecisions[i.id]?.note}”</>}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        {/* Actions */}
        <section className="mt-8">
          <Card tone="brand">
            <h2 className="text-[18px] font-bold">Decision</h2>
            {status === 'verified' ? (
              <p className="mt-1 font-semibold text-ok">✓ Verified clean profile{doc.review.verifiedBy && ` – by ${doc.review.verifiedBy}`}</p>
            ) : (
              <p className="mt-1 text-[15px]">Approve when nothing is open. Or send the profile back with a short note for the candidate.</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                disabled={!canApprove}
                onClick={() =>
                  void saveReview((r) => {
                    const at = new Date().toISOString()
                    return { ...r, verifiedAt: at, verifiedBy: by, auditLog: [...r.auditLog, auditEntry(null, 'profile_verified', null, at, 'executive', by, at)] }
                  })
                }
              >
                Approve profile
              </Button>
            </div>
            {status !== 'in_progress' && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <input
                  value={reopenNote}
                  onChange={(e) => setReopenNote(e.target.value)}
                  placeholder="Note for the candidate (simple English)"
                  aria-label="Note for the candidate"
                  maxLength={500}
                  className="min-h-[44px] min-w-[240px] flex-1 rounded-xl border-2 border-line bg-white px-3 outline-none focus:border-brand"
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() =>
                    void saveReview((r) => {
                      const at = new Date().toISOString()
                      return { ...r, reopenedAt: at, reopenNote: reopenNote.trim() || null, verifiedAt: null, verifiedBy: null, auditLog: [...r.auditLog, auditEntry(null, 'profile_reopened', null, reopenNote || 'reopened', 'executive', by, at)] }
                    })
                  }
                >
                  Send back to candidate
                </Button>
              </div>
            )}
          </Card>
        </section>

        {/* Timeline */}
        <section className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-[18px] font-bold">Timeline</h2>
            <TimelineVisual
              entries={entries}
              gaps={validation.gaps}
              presentLabel="Present"
              missingLabel="Unexplained period"
              overlapIds={new Set(validation.overlaps.map((o) => [o.entryIdA, o.entryIdB]).flat())}
              overlapLabel="Overlaps another entry"
              renderGapAction={(g) => (g.status === 'ignored_by_admin' ? <p className="mt-1 text-[14px] text-muted">Accepted by executive</p> : null)}
            />
          </div>

          <div>
            <h2 className="mb-3 text-[18px] font-bold">Names: raw → normalized → verified</h2>
            <div className="overflow-x-auto rounded-[var(--radius-card)] border border-line">
              <table className="w-full min-w-[520px] text-left text-[14px]">
                <thead className="bg-surface text-muted">
                  <tr>
                    <th className="p-2">Candidate entered</th>
                    <th className="p-2">Normalized</th>
                    <th className="p-2">Verified</th>
                    <th className="p-2">German</th>
                  </tr>
                </thead>
                <tbody>
                  {orgRows.map(({ e, org }) => (
                    <tr key={e.id} className="border-t border-line align-top">
                      <td className="p-2">{org.rawValue}</td>
                      <td className="p-2">{org.normalizedValue}</td>
                      <td className="p-2">{org.verifiedValue ?? <Badge tone="warn">Not verified</Badge>}</td>
                      <td className="p-2">{org.germanValue ?? '—'} {org.germanStatus !== 'verified' && <Badge tone="warn">{org.germanStatus}</Badge>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {evidence.length > 0 && (
              <>
                <h2 className="mb-2 mt-6 text-[18px] font-bold">Documents</h2>
                <ul className="space-y-2">
                  {evidence.map(({ e, file }) => (
                    <li key={file.id}>
                      <button
                        type="button"
                        className="font-semibold text-brand-dark underline"
                        onClick={async () => {
                          const url = await adminRepository.fileUrl(file.storage, file.path).catch(() => null)
                          if (url) window.open(url, '_blank', 'noopener')
                          else setError('File is not available on this device.')
                        }}
                      >
                        {entryTitle(e)} – {file.fileName}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </section>

        {/* Audit trail */}
        <section className="mt-8">
          <details>
            <summary className="min-h-[44px] cursor-pointer py-2 text-[18px] font-bold">Audit trail ({audit.length})</summary>
            <ul className="mt-2 divide-y divide-line rounded-[var(--radius-card)] border border-line text-[14px]">
              {audit.map((a) => {
                const e = entries.find((x) => x.id === a.entryId) as TimelineEntry | undefined
                return (
                  <li key={a.id} className="grid gap-1 p-2 sm:grid-cols-[170px_110px_1fr]">
                    <span className="text-muted">{new Date(a.changedAt).toLocaleString()}</span>
                    <span><Badge tone={a.changedByType === 'executive' ? 'brand' : a.changedByType === 'system' ? 'plain' : 'ok'}>{a.changedByType}</Badge></span>
                    <span>
                      <strong>{a.field}</strong>
                      {e && <> · {entryTitle(e)}</>}
                      {(a.previousValue || a.newValue) && <span className="block break-words text-muted">{a.previousValue ?? '∅'} → {a.newValue ?? '∅'}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </details>
        </section>
      </main>
    </>
  )
}

export default function AdminCandidatePage() {
  const { id } = useParams<{ id: string }>()
  return <AdminGate>{(cfg) => <Review cfg={cfg} id={id} />}</AdminGate>
}
