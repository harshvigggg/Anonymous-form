'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { candidateStatus } from '@/domain/timeline/review'
import { validateProfile } from '@/domain/timeline/validators'
import { profileQuality } from '@/domain/timeline/quality'
import type { CandidateDoc, CandidateStatus } from '@/domain/timeline/types'
import { adminRepository } from '@/lib/database/repository'
import type { ClientConfig } from '@/lib/database/api'
import { AdminGate, AdminHeader, statusBadge, useExecName } from '@/components/admin/AdminShell'
import { Badge, Button, Card } from '@/components/ui'

function linkFor(token: string) {
  return `${window.location.origin}/candidate/${token}`
}

function CopyLink({ token }: { token: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(linkFor(token))
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch {
          window.prompt('Copy this link', linkFor(token))
        }
      }}
    >
      {copied ? 'Copied ✓' : 'Copy link'}
    </Button>
  )
}

function CandidateList({ cfg }: { cfg: ClientConfig }) {
  const [docs, setDocs] = useState<CandidateDoc[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [created, setCreated] = useState<CandidateDoc | null>(null)
  const [busy, setBusy] = useState(false)
  const [execName, setExecName] = useExecName()
  const [filter, setFilter] = useState<'all' | CandidateStatus>('all')

  const load = useCallback(() => {
    adminRepository.list().then(setDocs).catch((e: Error) => setError(e.message))
  }, [])
  useEffect(load, [load])

  const rows = useMemo(
    () =>
      (docs ?? []).map((d) => {
        const v = validateProfile(d.profile, d.review, { candidateId: d.id })
        return { d, status: candidateStatus(d), quality: profileQuality(v).total, errors: v.errors.length, warnings: v.warnings.length }
      }),
    [docs],
  )
  const visible = rows.filter((r) => filter === 'all' || r.status === filter)

  return (
    <>
      <AdminHeader cfg={cfg}>
        <label className="text-[14px] text-muted" htmlFor="exec-name">Reviewer</label>
        <input
          id="exec-name"
          value={execName}
          onChange={(e) => setExecName(e.target.value)}
          placeholder="Your name"
          className="min-h-[40px] w-36 rounded-lg border border-line px-2 text-[15px]"
        />
      </AdminHeader>
      <main className="mx-auto max-w-5xl px-4 py-6">
        {!cfg.remote && (
          <Card tone="warn" className="mb-5">
            <p className="font-semibold">Demo mode</p>
            <p className="text-[15px]">
              Profiles are saved only in this browser, so links will not work on another phone. Connect the database (see README) to share links with candidates.
            </p>
          </Card>
        )}

        <Card>
          <h2 className="text-[18px] font-bold">Create candidate link</h2>
          <form
            className="mt-3 grid gap-3 sm:grid-cols-[1fr_200px_auto]"
            onSubmit={async (e) => {
              e.preventDefault()
              if (!name.trim()) return
              setBusy(true)
              try {
                const doc = await adminRepository.create(name.trim(), phone.trim() || null)
                setCreated(doc)
                setName('')
                setPhone('')
                load()
              } catch (err) {
                setError((err as Error).message)
              } finally {
                setBusy(false)
              }
            }}
          >
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" aria-label="Full name" className="min-h-[48px] rounded-xl border-2 border-line px-3 outline-none focus:border-brand" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" aria-label="Phone" inputMode="tel" className="min-h-[48px] rounded-xl border-2 border-line px-3 outline-none focus:border-brand" />
            <Button type="submit" size="md" disabled={busy || !name.trim()}>Create link</Button>
          </form>
          {created && (
            <div className="mt-4 rounded-xl bg-brand-soft p-3">
              <p className="font-semibold">Link for {created.fullName}:</p>
              <p className="break-all font-mono text-[14px]">{linkFor(created.token)}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <CopyLink token={created.token} />
                <a
                  className="inline-flex min-h-[44px] items-center rounded-2xl border-2 border-brand-line px-3 font-semibold text-brand-dark"
                  href={`https://wa.me/${(created.phone ?? '').replace(/\D/g, '')}?text=${encodeURIComponent(`Please fill your education and work timeline: ${linkFor(created.token)}`)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Share on WhatsApp
                </a>
              </div>
            </div>
          )}
        </Card>

        <div className="mb-3 mt-8 flex flex-wrap items-center gap-2">
          <h2 className="mr-auto text-[18px] font-bold">Candidates</h2>
          {(['all', 'submitted', 'in_progress', 'verified'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`min-h-[40px] rounded-full border px-3 text-[14px] font-semibold ${filter === f ? 'border-brand bg-brand text-white' : 'border-line bg-white'}`}
            >
              {f === 'all' ? 'All' : statusBadge[f].label.split(' –')[0]}
            </button>
          ))}
        </div>

        {error && <Card tone="danger" className="mb-3"><p className="text-danger">{error}</p></Card>}
        {!docs && !error && <p className="text-muted">Loading…</p>}
        {docs && visible.length === 0 && <p className="text-muted">No candidates yet.</p>}

        <ul className="flex flex-col gap-2">
          {visible.map(({ d, status, quality, errors, warnings }) => (
            <li key={d.id}>
              <Card className="flex flex-wrap items-center gap-3">
                <div className="min-w-[180px] flex-1">
                  <p className="font-bold">{d.fullName || 'Unnamed candidate'}</p>
                  <p className="text-[14px] text-muted">Updated {new Date(d.profile.updatedAt).toLocaleString()}</p>
                </div>
                <Badge tone={statusBadge[status].tone}>{statusBadge[status].label}</Badge>
                <span className="text-[14px] text-muted">Quality <strong className="text-ink">{quality}</strong>/100</span>
                <span className="text-[14px] text-muted">
                  {errors > 0 && <strong className="text-danger">{errors} blocking · </strong>}
                  {warnings} to review
                </span>
                <div className="flex gap-2">
                  <CopyLink token={d.token} />
                  <Link href={`/admin/candidates/${d.id}`} className="inline-flex min-h-[44px] items-center rounded-2xl bg-brand px-4 font-semibold text-white">
                    Open
                  </Link>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}

export default function AdminPage() {
  return <AdminGate>{(cfg) => <CandidateList cfg={cfg} />}</AdminGate>
}
