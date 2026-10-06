'use client'

import Link from 'next/link'
import { useEffect, useState, type ReactNode } from 'react'
import { adminCheckKey, getClientConfig, type ClientConfig } from '@/lib/database/api'
import { localStore } from '@/lib/database/localStore'
import { Badge, Button, Card, Spinner } from '@/components/ui'
import type { CandidateStatus } from '@/domain/timeline/types'

export const statusBadge: Record<CandidateStatus, { label: string; tone: 'plain' | 'warn' | 'ok' | 'brand' }> = {
  in_progress: { label: 'In progress', tone: 'plain' },
  submitted: { label: 'Submitted – needs review', tone: 'warn' },
  verified: { label: 'Verified', tone: 'ok' },
}

const NAME_KEY = 'ctl:exec-name'

export function useExecName(): [string, (n: string) => void] {
  const [name, setName] = useState('')
  useEffect(() => {
    try {
      setName(window.localStorage.getItem(NAME_KEY) ?? '')
    } catch {
      /* ignore */
    }
  }, [])
  return [
    name,
    (n: string) => {
      setName(n)
      try {
        window.localStorage.setItem(NAME_KEY, n)
      } catch {
        /* ignore */
      }
    },
  ]
}

/** Asks for the executive passcode when the database is connected. */
export function AdminGate({ children }: { children: (cfg: ClientConfig) => ReactNode }) {
  const [cfg, setCfg] = useState<ClientConfig | null>(null)
  const [ok, setOk] = useState<boolean | null>(null)
  const [key, setKey] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    getClientConfig().then(async (c) => {
      setCfg(c)
      if (!c.remote) return setOk(true)
      setOk(localStore.adminKey() ? await adminCheckKey().catch(() => false) : false)
    })
  }, [])

  if (!cfg || ok === null) return <Spinner label="Loading…" />
  if (ok) return <>{children(cfg)}</>
  return (
    <div className="mx-auto max-w-sm py-20">
      <Card>
        <h1 className="text-[20px] font-bold">Executive review</h1>
        <p className="mt-1 text-muted">Enter the passcode to continue.</p>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={async (e) => {
            e.preventDefault()
            localStore.setAdminKey(key)
            const good = await adminCheckKey().catch(() => false)
            setErr(good ? null : 'Wrong passcode, or ADMIN_KEY is not set on the server.')
            setOk(good)
          }}
        >
          <label className="font-semibold" htmlFor="admin-key">Passcode</label>
          <input
            id="admin-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="min-h-[48px] rounded-xl border-2 border-line px-3 outline-none focus:border-brand"
            autoFocus
          />
          {err && <p className="text-danger">{err}</p>}
          <Button type="submit">Open</Button>
        </form>
      </Card>
    </div>
  )
}

export function AdminHeader({ cfg, children }: { cfg: ClientConfig; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3">
        <Link href="/admin" className="text-[17px] font-bold">Executive review</Link>
        {cfg.remote ? <Badge tone="ok">Database connected</Badge> : <Badge tone="warn">Demo mode · saved in this browser only</Badge>}
        <div className="ml-auto flex items-center gap-2">{children}</div>
      </div>
    </header>
  )
}
