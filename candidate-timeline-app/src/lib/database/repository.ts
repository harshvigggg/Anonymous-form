import type { MasterOrg } from '@/config/institutions'
import { blankCandidate, DEMO_TOKEN, seedCandidate } from '@/data/seed'
import type { CandidateDoc, ExecutiveReview } from '@/domain/timeline/types'
import { newId, newToken } from '@/lib/ids'
import * as api from './api'
import { localStore } from './localStore'

/**
 * Executive-side repository. Picks the database when it is configured,
 * otherwise this browser's storage.
 */
export const adminRepository = {
  async mode(): Promise<api.ClientConfig> {
    return api.getClientConfig()
  },

  async list(): Promise<CandidateDoc[]> {
    const { remote } = await api.getClientConfig()
    if (remote) return api.adminList()
    if (!localStore.get(DEMO_TOKEN)) localStore.put(DEMO_TOKEN, seedCandidate(newId()), false)
    return localStore.list().sort((a, b) => b.profile.updatedAt.localeCompare(a.profile.updatedAt))
  },

  async create(fullName: string, phone: string | null): Promise<CandidateDoc> {
    const { remote } = await api.getClientConfig()
    if (remote) return api.adminCreate({ fullName, phone })
    const doc = blankCandidate(newId(), newToken(), fullName, phone)
    localStore.put(doc.token, doc, false)
    return doc
  },

  async get(id: string): Promise<CandidateDoc | null> {
    const { remote } = await api.getClientConfig()
    if (remote) return api.adminGet(id)
    return localStore.findById(id)
  },

  async saveReview(doc: CandidateDoc, review: ExecutiveReview): Promise<void> {
    const { remote } = await api.getClientConfig()
    if (remote) return api.adminSaveReview(doc.id, review)
    const stored = localStore.get(doc.token)
    if (stored) localStore.put(doc.token, { ...stored.doc, review }, stored.pending)
  },

  async addOrg(org: MasterOrg): Promise<void> {
    const { remote } = await api.getClientConfig()
    if (remote) return api.adminAddOrg(org)
    localStore.addOrg(org)
  },

  async fileUrl(storage: 'local' | 'remote', path: string): Promise<string | null> {
    if (storage === 'local') return localStore.getFile(path)
    return api.adminFileUrl(path)
  },
}
