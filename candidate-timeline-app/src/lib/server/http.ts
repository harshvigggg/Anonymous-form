import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { remoteConfigured } from './store'

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

export function error(status: number, message: string) {
  return json({ error: message }, status)
}

export function notConfigured() {
  return error(503, 'Database is not connected – the app is running in "this browser only" mode.')
}

/** Executive endpoints need the ADMIN_KEY passcode. */
export function requireAdmin(req: Request): Response | null {
  if (!remoteConfigured()) return notConfigured()
  const expected = process.env.ADMIN_KEY
  if (!expected) return error(503, 'Set ADMIN_KEY in the environment to open the executive review.')
  const given = req.headers.get('x-admin-key') ?? ''
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return error(401, 'Wrong passcode')
  return null
}

export function demoEnabled(): boolean {
  return process.env.DEMO_ENABLED !== 'false'
}

export const MAX_BODY_BYTES = 1_500_000

export async function readJson(req: Request): Promise<unknown> {
  const length = Number(req.headers.get('content-length') ?? 0)
  if (length > MAX_BODY_BYTES) throw new Error('too_large')
  const text = await req.text()
  if (text.length > MAX_BODY_BYTES) throw new Error('too_large')
  return JSON.parse(text)
}

// Structural checks for stored documents (field rules live in the domain schemas).
const entryShape = z
  .object({ id: z.string().max(80), type: z.enum(['training', 'school', 'professional_experience', 'career_break', 'volunteering']) })
  .passthrough()

export const profileSchema = z.object({
  entries: z.array(entryShape).max(100),
  confirmedOverlaps: z.record(z.string()),
  welcomeSeen: z.boolean(),
  submittedAt: z.string().nullable(),
  auditLog: z.array(z.object({ id: z.string() }).passthrough()).max(5000),
  rev: z.number(),
  updatedAt: z.string(),
})

export const reviewSchema = z.object({
  entryOverrides: z.record(z.object({ at: z.string(), by: z.string() }).passthrough()),
  issueDecisions: z.record(z.object({ status: z.literal('accepted_by_admin'), at: z.string(), by: z.string() }).passthrough()),
  verifiedAt: z.string().nullable(),
  verifiedBy: z.string().nullable(),
  reopenedAt: z.string().nullable(),
  reopenNote: z.string().max(500).nullable(),
  auditLog: z.array(z.object({ id: z.string() }).passthrough()).max(5000),
  updatedAt: z.string(),
})

export const orgSchema = z
  .object({
    id: z.string().max(120),
    kind: z.enum(['institution', 'school', 'facility']),
    normalizedName: z.string().min(1).max(200),
    germanName: z.string().max(200).nullable(),
    city: z.string().max(120),
    country: z.string().max(120),
    aliases: z.array(z.string().max(200)).max(50),
  })
  .passthrough()
