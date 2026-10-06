import { remoteConfigured } from '@/lib/server/store'
import { demoEnabled, json } from '@/lib/server/http'

export const dynamic = 'force-dynamic'

export function GET() {
  return json({ remote: remoteConfigured(), demo: demoEnabled() })
}
