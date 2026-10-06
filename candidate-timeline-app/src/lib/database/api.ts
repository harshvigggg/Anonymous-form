import type { MasterOrg } from '@/config/institutions'
import type { CandidateDoc, CandidateProfile, EvidenceFile, ExecutiveReview } from '@/domain/timeline/types'
import { localStore } from './localStore'

/**
 * Client-side data access. Pages never call fetch directly – they go through
 * these functions, so the storage backend can change without touching UI code.
 */

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export interface ClientConfig {
  /** true → data is stored in the database; false → in this browser only */
  remote: boolean
  demo: boolean
}

let configPromise: Promise<ClientConfig> | null = null

export function getClientConfig(): Promise<ClientConfig> {
  if (!configPromise) {
    configPromise = fetch('/api/config', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('config'))))
      .then((c: ClientConfig) => {
        localStore.cacheMode({ remote: c.remote })
        return c
      })
      .catch(() => {
        configPromise = null
        const cached = localStore.cachedMode()
        return { remote: cached?.remote ?? false, demo: true }
      })
  }
  return configPromise
}

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText
    try {
      message = ((await res.json()) as { error?: string }).error ?? message
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, message)
  }
  return (await res.json()) as T
}

// ---------- Candidate ----------

export async function fetchCandidate(token: string): Promise<CandidateDoc | null> {
  const res = await fetch(`/api/candidates/${encodeURIComponent(token)}`, { cache: 'no-store' })
  if (res.status === 404) return null
  return json<CandidateDoc>(res)
}

export async function putCandidateProfile(token: string, profile: CandidateProfile): Promise<void> {
  const res = await fetch(`/api/candidates/${encodeURIComponent(token)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile }),
  })
  await json<{ ok: true }>(res)
}

export async function uploadCandidateFile(token: string, file: Blob, fileName: string): Promise<EvidenceFile> {
  const body = new FormData()
  body.append('file', file, fileName)
  const res = await fetch(`/api/candidates/${encodeURIComponent(token)}/documents`, { method: 'POST', body })
  return json<EvidenceFile>(res)
}

export async function fetchOrgAdditions(): Promise<MasterOrg[]> {
  const res = await fetch('/api/organizations', { cache: 'no-store' })
  return json<MasterOrg[]>(res)
}

// ---------- Executive ----------

function adminHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json', 'x-admin-key': localStore.adminKey() }
}

export async function adminList(): Promise<CandidateDoc[]> {
  return json<CandidateDoc[]>(await fetch('/api/admin/candidates', { headers: adminHeaders(), cache: 'no-store' }))
}

export async function adminCreate(input: { fullName: string; phone: string | null }): Promise<CandidateDoc> {
  return json<CandidateDoc>(
    await fetch('/api/admin/candidates', { method: 'POST', headers: adminHeaders(), body: JSON.stringify(input) }),
  )
}

export async function adminGet(id: string): Promise<CandidateDoc | null> {
  const res = await fetch(`/api/admin/candidates/${encodeURIComponent(id)}`, { headers: adminHeaders(), cache: 'no-store' })
  if (res.status === 404) return null
  return json<CandidateDoc>(res)
}

export async function adminSaveReview(id: string, review: ExecutiveReview): Promise<void> {
  await json<{ ok: true }>(
    await fetch(`/api/admin/candidates/${encodeURIComponent(id)}`, { method: 'PUT', headers: adminHeaders(), body: JSON.stringify({ review }) }),
  )
}

export async function adminAddOrg(org: MasterOrg): Promise<void> {
  await json<{ ok: true }>(await fetch('/api/admin/organizations', { method: 'POST', headers: adminHeaders(), body: JSON.stringify(org) }))
}

export async function adminFileUrl(path: string): Promise<string> {
  const res = await fetch(`/api/admin/documents?path=${encodeURIComponent(path)}`, { headers: adminHeaders(), cache: 'no-store' })
  return (await json<{ url: string }>(res)).url
}

export async function adminCheckKey(): Promise<boolean> {
  const res = await fetch('/api/admin/candidates?check=1', { headers: adminHeaders(), cache: 'no-store' })
  return res.ok
}
