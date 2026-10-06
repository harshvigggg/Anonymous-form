import { db, remoteConfigured } from '@/lib/server/store'
import { demoEnabled, error, json, notConfigured, profileSchema, readJson } from '@/lib/server/http'
import { DEMO_TOKEN, seedCandidate } from '@/data/seed'
import { candidateStatus } from '@/domain/timeline/review'
import type { CandidateProfile } from '@/domain/timeline/types'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ token: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  if (!remoteConfigured()) return notConfigured()
  const { token } = await params
  try {
    let doc = await db.byToken(token)
    if (!doc && token === DEMO_TOKEN && demoEnabled()) {
      const seed = seedCandidate('', DEMO_TOKEN)
      doc = await db.insert(seed)
    }
    if (!doc) return error(404, 'Not found')
    // Candidates do not need the executive audit log.
    return json({ ...doc, review: { ...doc.review, auditLog: [] } })
  } catch (e) {
    console.error(e)
    return error(502, 'Could not load profile')
  }
}

export async function PUT(req: Request, { params }: Ctx) {
  if (!remoteConfigured()) return notConfigured()
  const { token } = await params
  let body: unknown
  try {
    body = await readJson(req)
  } catch {
    return error(413, 'Request too large or invalid')
  }
  const parsed = profileSchema.safeParse((body as { profile?: unknown })?.profile)
  if (!parsed.success) return error(400, 'Invalid profile')
  try {
    const doc = await db.byToken(token)
    if (!doc) return error(404, 'Not found')
    if (candidateStatus(doc) === 'verified') return error(423, 'Profile is verified and locked')
    await db.saveProfile(token, parsed.data as unknown as CandidateProfile)
    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return error(502, 'Could not save')
  }
}
