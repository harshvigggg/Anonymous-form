import { db } from '@/lib/server/store'
import { error, json, readJson, requireAdmin, reviewSchema } from '@/lib/server/http'
import type { ExecutiveReview } from '@/domain/timeline/types'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const { id } = await params
  const doc = await db.byId(id).catch(() => null)
  return doc ? json(doc) : error(404, 'Not found')
}

/** Executives only ever write the review part – candidate answers stay untouched. */
export async function PUT(req: Request, { params }: Ctx) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const { id } = await params
  const parsed = reviewSchema.safeParse((await readJson(req).catch(() => null) as { review?: unknown } | null)?.review)
  if (!parsed.success) return error(400, 'Invalid review')
  try {
    await db.saveReview(id, parsed.data as unknown as ExecutiveReview)
    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return error(502, 'Could not save')
  }
}
