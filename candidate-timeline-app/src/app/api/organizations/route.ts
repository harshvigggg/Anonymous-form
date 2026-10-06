import { db, remoteConfigured } from '@/lib/server/store'
import { error, json } from '@/lib/server/http'

export const dynamic = 'force-dynamic'

/** Executive-approved institutions / hospitals (names only – not personal data). */
export async function GET() {
  if (!remoteConfigured()) return json([])
  try {
    return json(await db.orgs())
  } catch {
    return error(502, 'Could not load organisations')
  }
}
