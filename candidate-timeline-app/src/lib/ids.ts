const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function randomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

export function newId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID()
  const b = randomBytes(16)
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
}

/** Unguessable link token for a candidate (≈ 140 bits). */
export function newToken(length = 24): string {
  return Array.from(randomBytes(length), (b) => ALPHABET[b % ALPHABET.length]).join('')
}
