import { db } from '@/lib/server/store'
import { error, json, readJson, requireAdmin } from '@/lib/server/http'
import { blankCandidate } from '@/data/seed'
import { newToken } from '@/lib/ids'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  if (new URL(req.url).searchParams.get('check')) return json({ ok: true })
  try {
    return json(await db.list())
  } catch (e) {
    console.error(e)
    return error(502, 'Could not load candidates')
  }
}

const createSchema = z.object({ fullName: z.string().trim().min(1).max(120), phone: z.string().trim().max(30).nullable().optional() })

/** Executive creates a candidate → the system creates a secure link token. */
export async function POST(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const parsed = createSchema.safeParse(await readJson(req).catch(() => null))
  if (!parsed.success) return error(400, 'Name is required')
  try {
    const doc = blankCandidate('', newToken(), parsed.data.fullName, parsed.data.phone || null)
    return json(await db.insert(doc))
  } catch (e) {
    console.error(e)
    return error(502, 'Could not create candidate')
  }
}
