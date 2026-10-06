import type { MasterOrg } from '@/config/institutions'
import type { CandidateDoc } from '@/domain/timeline/types'

/**
 * Browser storage. In "this browser only" mode it is the database; in
 * database mode it is the offline copy that keeps answers safe until they sync.
 * Every access is wrapped – storage can be blocked or full.
 */
const DOC_PREFIX = 'ctl:c:'
const FILE_PREFIX = 'ctl:f:'
const ORGS_KEY = 'ctl:orgs'
const ADMIN_KEY = 'ctl:admin-key'
const MODE_KEY = 'ctl:mode'

export interface StoredDoc {
  doc: CandidateDoc
  /** Changes not yet confirmed by the server */
  pending: boolean
}

function read<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

export const localStore = {
  get(token: string): StoredDoc | null {
    return read<StoredDoc>(DOC_PREFIX + token)
  },
  put(token: string, doc: CandidateDoc, pending: boolean): boolean {
    return write(DOC_PREFIX + token, { doc, pending } satisfies StoredDoc)
  },
  markSynced(token: string, rev: number): void {
    const s = this.get(token)
    if (s && s.doc.profile.rev === rev) write(DOC_PREFIX + token, { ...s, pending: false })
  },
  list(): CandidateDoc[] {
    const out: CandidateDoc[] = []
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i)
        if (key?.startsWith(DOC_PREFIX)) {
          const s = read<StoredDoc>(key)
          if (s?.doc) out.push(s.doc)
        }
      }
    } catch {
      /* storage blocked */
    }
    return out
  },
  findById(id: string): CandidateDoc | null {
    return this.list().find((d) => d.id === id) ?? null
  },

  orgs(): MasterOrg[] {
    return read<MasterOrg[]>(ORGS_KEY) ?? []
  },
  addOrg(org: MasterOrg): void {
    write(ORGS_KEY, [...this.orgs().filter((o) => o.id !== org.id), org])
  },

  putFile(id: string, dataUrl: string): boolean {
    try {
      window.localStorage.setItem(FILE_PREFIX + id, dataUrl)
      return true
    } catch {
      return false
    }
  },
  getFile(id: string): string | null {
    try {
      return window.localStorage.getItem(FILE_PREFIX + id)
    } catch {
      return null
    }
  },

  adminKey(): string {
    return read<string>(ADMIN_KEY) ?? ''
  },
  setAdminKey(key: string): void {
    write(ADMIN_KEY, key)
  },

  cachedMode(): { remote: boolean } | null {
    return read<{ remote: boolean }>(MODE_KEY)
  },
  cacheMode(mode: { remote: boolean }): void {
    write(MODE_KEY, mode)
  },
}
