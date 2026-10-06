'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { MasterOrg } from '@/config/institutions'
import { evidenceRules } from '@/config/validationRules'
import { blankCandidate, DEMO_TOKEN, seedCandidate } from '@/data/seed'
import { auditEntry } from '@/domain/timeline/audit'
import { candidateStatus } from '@/domain/timeline/review'
import { validateProfile, type ProfileValidation } from '@/domain/timeline/validators'
import type { AuditLogEntry, CandidateDoc, CandidateProfile, CandidateStatus, EvidenceFile, TimelineEntry } from '@/domain/timeline/types'
import * as api from '@/lib/database/api'
import { localStore } from '@/lib/database/localStore'
import { newId } from '@/lib/ids'
import { blobToDataUrl, compressImage } from '@/lib/image'

export type SaveState = 'idle' | 'saving' | 'saved' | 'local' | 'error' | 'locked'
type LoadState = 'loading' | 'ready' | 'notfound' | 'error'

interface CandidateContextValue {
  token: string
  doc: CandidateDoc
  validation: ProfileValidation
  status: CandidateStatus
  locked: boolean
  remote: boolean
  saveState: SaveState
  orgAdditions: MasterOrg[]
  updateProfile: (fn: (p: CandidateProfile) => CandidateProfile) => void
  upsertEntry: (entry: TimelineEntry) => void
  deleteEntry: (id: string) => void
  audit: (entries: AuditLogEntry[]) => void
  retrySave: () => void
  uploadEvidence: (file: File) => Promise<EvidenceFile>
}

const CandidateContext = createContext<CandidateContextValue | null>(null)

export function useCandidate(): CandidateContextValue {
  const ctx = useContext(CandidateContext)
  if (!ctx) throw new Error('useCandidate must be used inside CandidateProvider')
  return ctx
}

const SYNC_DELAY_MS = 800

export function CandidateProvider({
  token,
  children,
  renderState,
}: {
  token: string
  children: ReactNode
  renderState: (state: 'loading' | 'notfound' | 'error', retry: () => void) => ReactNode
}) {
  const [doc, setDoc] = useState<CandidateDoc | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [remote, setRemote] = useState(false)
  const [orgAdditions, setOrgAdditions] = useState<MasterOrg[]>([])
  const [loadAttempt, setLoadAttempt] = useState(0)

  const docRef = useRef<CandidateDoc | null>(null)
  const remoteRef = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const syncing = useRef(false)
  const again = useRef(false)

  const sync = useCallback(async () => {
    const current = docRef.current
    if (!current || !remoteRef.current) return
    if (syncing.current) {
      again.current = true
      return
    }
    syncing.current = true
    setSaveState('saving')
    const rev = current.profile.rev
    try {
      await api.putCandidateProfile(token, current.profile)
      localStore.markSynced(token, rev)
      setSaveState('saved')
    } catch (e) {
      setSaveState(e instanceof api.ApiError && e.status === 423 ? 'locked' : 'error')
    } finally {
      syncing.current = false
      if (again.current) {
        again.current = false
        void sync()
      }
    }
  }, [token])

  const scheduleSync = useCallback(() => {
    if (!remoteRef.current) {
      setSaveState('local')
      return
    }
    setSaveState('saving')
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => void sync(), SYNC_DELAY_MS)
  }, [sync])

  // Load: local copy first, then the database (if configured).
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadState('loading')
      const cfg = await api.getClientConfig()
      remoteRef.current = cfg.remote
      setRemote(cfg.remote)
      const local = localStore.get(token)

      if (!cfg.remote) {
        let d = local?.doc
        if (!d) {
          d = token === DEMO_TOKEN ? seedCandidate(newId(), token) : blankCandidate(newId(), token)
          localStore.put(token, d, false)
        }
        setOrgAdditions(localStore.orgs())
        if (!cancelled) {
          docRef.current = d
          setDoc(d)
          setLoadState('ready')
        }
        return
      }

      try {
        const [remoteDoc, orgs] = await Promise.all([api.fetchCandidate(token), api.fetchOrgAdditions().catch(() => [])])
        if (cancelled) return
        if (!remoteDoc) {
          setLoadState('notfound')
          return
        }
        let d = remoteDoc
        let pending = false
        if (local?.pending && local.doc.id === remoteDoc.id && local.doc.profile.rev >= remoteDoc.profile.rev) {
          d = { ...remoteDoc, profile: local.doc.profile }
          pending = true
        }
        localStore.put(token, d, pending)
        docRef.current = d
        setDoc(d)
        setOrgAdditions(orgs)
        setLoadState('ready')
        if (pending) void sync()
      } catch {
        if (cancelled) return
        if (local) {
          docRef.current = local.doc
          setDoc(local.doc)
          setSaveState(local.pending ? 'error' : 'idle')
          setLoadState('ready')
        } else setLoadState('error')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [token, loadAttempt, sync])

  // Retry automatically when the phone comes back online.
  useEffect(() => {
    const onOnline = () => {
      if (localStore.get(token)?.pending) void sync()
    }
    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [token, sync])

  const updateProfile = useCallback(
    (fn: (p: CandidateProfile) => CandidateProfile) => {
      const prev = docRef.current
      if (!prev) return
      const profile = fn(prev.profile)
      const next: CandidateDoc = { ...prev, profile: { ...profile, rev: prev.profile.rev + 1, updatedAt: new Date().toISOString() } }
      docRef.current = next
      setDoc(next)
      localStore.put(token, next, remoteRef.current)
      scheduleSync()
    },
    [token, scheduleSync],
  )

  const upsertEntry = useCallback(
    (entry: TimelineEntry) =>
      updateProfile((p) => {
        const exists = p.entries.some((e) => e.id === entry.id)
        return { ...p, entries: exists ? p.entries.map((e) => (e.id === entry.id ? entry : e)) : [...p.entries, entry] }
      }),
    [updateProfile],
  )

  const deleteEntry = useCallback(
    (id: string) =>
      updateProfile((p) => ({
        ...p,
        entries: p.entries.filter((e) => e.id !== id),
        auditLog: [...p.auditLog, auditEntry(id, 'entry_deleted', id, null, 'candidate', token)],
      })),
    [updateProfile, token],
  )

  const audit = useCallback(
    (entries: AuditLogEntry[]) => {
      if (entries.length) updateProfile((p) => ({ ...p, auditLog: [...p.auditLog, ...entries] }))
    },
    [updateProfile],
  )

  const uploadEvidence = useCallback(
    async (file: File): Promise<EvidenceFile> => {
      if (!evidenceRules.acceptedTypes.includes(file.type)) throw new Error('type')
      const blob = await compressImage(file)
      const fileName = file.name.replace(/\.[^.]+$/, '') + (blob.type === 'image/jpeg' && blob !== file ? '.jpg' : file.name.match(/\.[^.]+$/)?.[0] ?? '')
      if (remoteRef.current) {
        if (blob.size > evidenceRules.maxRemoteBytes) throw new Error('size')
        return api.uploadCandidateFile(token, blob, fileName)
      }
      if (blob.size > evidenceRules.maxLocalBytes) throw new Error('size')
      const id = newId()
      if (!localStore.putFile(id, await blobToDataUrl(blob))) throw new Error('size')
      return { id, fileName, mimeType: blob.type, sizeKb: Math.round(blob.size / 1024), storage: 'local', path: id, uploadedAt: new Date().toISOString() }
    },
    [token],
  )

  const value = useMemo<CandidateContextValue | null>(() => {
    if (!doc) return null
    const status = candidateStatus(doc)
    return {
      token,
      doc,
      validation: validateProfile(doc.profile, doc.review, { candidateId: doc.id }),
      status,
      locked: status === 'verified',
      remote,
      saveState,
      orgAdditions,
      updateProfile,
      upsertEntry,
      deleteEntry,
      audit,
      retrySave: () => void sync(),
      uploadEvidence,
    }
  }, [doc, token, remote, saveState, orgAdditions, updateProfile, upsertEntry, deleteEntry, audit, sync, uploadEvidence])

  if (loadState !== 'ready' || !value) {
    return <>{renderState(loadState === 'ready' ? 'loading' : loadState, () => setLoadAttempt((n) => n + 1))}</>
  }
  return <CandidateContext.Provider value={value}>{children}</CandidateContext.Provider>
}
