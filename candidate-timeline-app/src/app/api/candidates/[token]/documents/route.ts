import { db, remoteConfigured } from '@/lib/server/store'
import { error, json, notConfigured } from '@/lib/server/http'
import { evidenceRules } from '@/config/validationRules'
import { newId } from '@/lib/ids'
import type { EvidenceFile } from '@/domain/timeline/types'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ token: string }> }

/** Optional diploma photo / PDF upload (V1: optional evidence). */
export async function POST(req: Request, { params }: Ctx) {
  if (!remoteConfigured()) return notConfigured()
  const { token } = await params
  const doc = await db.byToken(token).catch(() => null)
  if (!doc) return error(404, 'Not found')

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return error(400, 'No file')
  if (!evidenceRules.acceptedTypes.includes(file.type)) return error(415, 'Unsupported file type')
  if (file.size > evidenceRules.maxRemoteBytes) return error(413, 'File too large')

  const id = newId()
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-80) || 'file'
  const path = `${doc.id}/${id}-${safeName}`
  try {
    await db.upload(path, await file.arrayBuffer(), file.type)
  } catch (e) {
    console.error(e)
    return error(502, 'Upload failed')
  }
  const result: EvidenceFile = {
    id,
    fileName: file.name.slice(0, 120),
    mimeType: file.type,
    sizeKb: Math.round(file.size / 1024),
    storage: 'remote',
    path,
    uploadedAt: new Date().toISOString(),
  }
  return json(result)
}
