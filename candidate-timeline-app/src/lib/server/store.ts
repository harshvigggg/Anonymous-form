import 'server-only'
import type { MasterOrg } from '@/config/institutions'
import type { CandidateDoc, CandidateProfile, ExecutiveReview } from '@/domain/timeline/types'

/**
 * Database access (Supabase / PostgreSQL via its REST API).
 * Only used on the server with the service key – never sent to the browser.
 */
const url = process.env.SUPABASE_URL?.replace(/\/$/, '')
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'candidate-documents'

export function remoteConfigured(): boolean {
  return !!(url && key)
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { apikey: key!, ...extra }
  // Legacy service keys are JWTs; new "secret" keys only go in the apikey header.
  if (key!.startsWith('eyJ')) h.Authorization = `Bearer ${key}`
  return h
}

async function rest<T>(path: string, init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}): Promise<T> {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: headers({ 'Content-Type': 'application/json', ...(init.headers ?? {}) }),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Database error ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return (text ? JSON.parse(text) : null) as T
}

interface Row {
  id: string
  token: string
  full_name: string
  phone: string | null
  created_at: string
  profile: CandidateProfile
  review: ExecutiveReview
}

const toDoc = (r: Row): CandidateDoc => ({
  id: r.id,
  token: r.token,
  fullName: r.full_name,
  phone: r.phone,
  createdAt: r.created_at,
  profile: r.profile,
  review: r.review,
})

const enc = encodeURIComponent

export const db = {
  async byToken(token: string): Promise<CandidateDoc | null> {
    const rows = await rest<Row[]>(`candidates?token=eq.${enc(token)}&select=*`)
    return rows[0] ? toDoc(rows[0]) : null
  },
  async byId(id: string): Promise<CandidateDoc | null> {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return null
    const rows = await rest<Row[]>(`candidates?id=eq.${enc(id)}&select=*`)
    return rows[0] ? toDoc(rows[0]) : null
  },
  async list(): Promise<CandidateDoc[]> {
    const rows = await rest<Row[]>(`candidates?select=*&order=updated_at.desc&limit=300`)
    return rows.map(toDoc)
  },
  async insert(doc: Omit<CandidateDoc, 'id' | 'createdAt'>): Promise<CandidateDoc> {
    const rows = await rest<Row[]>('candidates', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ token: doc.token, full_name: doc.fullName, phone: doc.phone, profile: doc.profile, review: doc.review }),
    })
    return toDoc(rows[0])
  },
  async saveProfile(token: string, profile: CandidateProfile): Promise<void> {
    await rest(`candidates?token=eq.${enc(token)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ profile, updated_at: new Date().toISOString() }),
    })
  },
  async saveReview(id: string, review: ExecutiveReview): Promise<void> {
    await rest(`candidates?id=eq.${enc(id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ review, updated_at: new Date().toISOString() }),
    })
  },
  async orgs(): Promise<MasterOrg[]> {
    const rows = await rest<{ data: MasterOrg }[]>('organizations?select=data&order=created_at.asc&limit=5000')
    return rows.map((r) => r.data)
  },
  async addOrg(org: MasterOrg): Promise<void> {
    await rest('organizations', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({ id: org.id, kind: org.kind, data: org }),
    })
  },
  async upload(path: string, body: ArrayBuffer, contentType: string): Promise<void> {
    const res = await fetch(`${url}/storage/v1/object/${BUCKET}/${path}`, {
      method: 'POST',
      headers: headers({ 'Content-Type': contentType, 'x-upsert': 'true' }),
      body,
    })
    if (!res.ok) throw new Error(`Storage error ${res.status}: ${await res.text()}`)
  },
  async signedUrl(path: string): Promise<string> {
    const res = await fetch(`${url}/storage/v1/object/sign/${BUCKET}/${path}`, {
      method: 'POST',
      headers: headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ expiresIn: 600 }),
    })
    if (!res.ok) throw new Error(`Storage error ${res.status}`)
    const { signedURL } = (await res.json()) as { signedURL: string }
    return `${url}/storage/v1${signedURL}`
  },
}
