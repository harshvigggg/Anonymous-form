import { db } from '@/lib/server/store'
import { error, json, requireAdmin } from '@/lib/server/http'

export const dynamic = 'force-dynamic'

/** Short-lived link to a candidate's uploaded file. */
export async function GET(req: Request) {
  const denied = requireAdmin(req)
  if (denied) return denied
  const path = new URL(req.url).searchParams.get('path') ?? ''
  if (!/^[0-9a-f-]{36}\/[\w.-]+$/i.test(path)) return error(400, 'Invalid path')
  try {
    return json({ url: await db.signedUrl(path) })
  } catch {
    return error(502, 'Could not create link')
  }
}
