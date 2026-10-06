import { db } from '@/lib/server/store'
import { error, json, orgSchema, readJson, requireAdmin } from '@/lib/server/http'
import type { MasterOrg } from '@/config/institutions'

export const dynamic = 'force-dynamic'

/** Adds an executive-verified name to the master list – the database improves with every profile. */
export async function POST(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const parsed = orgSchema.safeParse(await readJson(req).catch(() => null))
  if (!parsed.success) return error(400, 'Invalid organisation')
  try {
    await db.addOrg(parsed.data as unknown as MasterOrg)
    return json({ ok: true })
  } catch (e) {
    console.error(e)
    return error(502, 'Could not save')
  }
}
