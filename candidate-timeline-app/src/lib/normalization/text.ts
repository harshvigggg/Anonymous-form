/** Common misspellings seen in candidate input → correct word. Keys are lower case. */
const SPELLING_FIXES: Record<string, string> = {
  nusing: 'nursing', nursng: 'nursing', nurshing: 'nursing', nurisng: 'nursing', nursin: 'nursing', narsing: 'nursing', nursiing: 'nursing',
  hospitel: 'hospital', hosptal: 'hospital', hospitl: 'hospital', hospial: 'hospital', hopital: 'hospital', hospitall: 'hospital', haspatal: 'hospital',
  collage: 'college', colege: 'college', collge: 'college', colleg: 'college', collegee: 'college',
  scool: 'school', shool: 'school', schol: 'school', schoool: 'school', skool: 'school',
  institue: 'institute', institude: 'institute', insititute: 'institute', instutite: 'institute',
  univercity: 'university', universty: 'university', unversity: 'university', universiti: 'university',
  medicl: 'medical', mediacal: 'medical', madical: 'medical',
  sciense: 'science', scince: 'science',
  govt: 'government', goverment: 'government', govenment: 'government',
  vidyalay: 'vidyalaya', vidyalya: 'vidyalaya', vidhyalaya: 'vidyalaya',
  kendriy: 'kendriya', kendria: 'kendriya',
  navoday: 'navodaya',
  clinc: 'clinic', clinik: 'clinic',
  memmorial: 'memorial',
  hom: 'home',
  reserch: 'research',
}

const SMALL_WORDS = new Set(['of', 'and', 'the', 'for', 'in', 'at', 'on', 'de'])

/** Words that should stay upper-case. */
const ACRONYMS = new Set([
  'aiims', 'gnm', 'anm', 'kv', 'esi', 'esic', 'cmc', 'pgimer', 'pgi', 'kem', 'nims', 'kgmu', 'sskm', 'ipgmer', 'icu', 'nicu', 'picu', 'ccu',
  'ngo', 'mch', 'phc', 'chc', 'dav', 'dps', 'jnv', 'afmc', 'rak', 'srm', 'nhs', 'uae', 'usa', 'uk', 'ot',
])

export function collapseSpaces(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

/** "  oxford nusing   school " → "Oxford Nursing School" */
export function normalizeName(raw: string): string {
  const cleaned = collapseSpaces(raw.replace(/[“”"]/g, '').replace(/\s*,\s*/g, ', ').replace(/\s*-\s*/g, ' - '))
  if (!cleaned) return ''
  const allCaps = cleaned === cleaned.toUpperCase()
  return cleaned
    .split(' ')
    .map((word, i) => {
      const trailing = /[,;:]$/.exec(word)?.[0] ?? ''
      const w = trailing ? word.slice(0, -1) : word
      const lower = w.toLowerCase()
      const core = lower.replace(/[^a-z0-9]/g, '')
      const fixedCore = SPELLING_FIXES[core] ?? core
      let out = core && lower.includes(core) ? lower.replace(core, fixedCore) : lower
      const typedAsAcronym = !allCaps && /^[A-Z]{2,6}$/.test(w)
      if (ACRONYMS.has(fixedCore) || typedAsAcronym) out = out.toUpperCase()
      else if (/^no\.?$/.test(out)) out = 'No.'
      else if (!(i > 0 && SMALL_WORDS.has(out))) {
        out = out.replace(/(^|[(\-&./])([a-z])/g, (_m, p: string, c: string) => p + c.toUpperCase())
      }
      return out + trailing
    })
    .join(' ')
}

/** Comparison key: lower case, spelling fixed, punctuation and filler words removed. */
export function searchKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => SPELLING_FIXES[w] ?? w)
    .filter((w) => !SMALL_WORDS.has(w))
    .join(' ')
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return prev[b.length]
}

export function similarity(a: string, b: string): number {
  const max = Math.max(a.length, b.length)
  if (max === 0) return 1
  return 1 - levenshtein(a, b) / max
}

/**
 * Typo-tolerant score (0–1) of how well `query` matches `target`.
 * Every query word must find a close word in the target.
 */
export function matchScore(query: string, target: string): number {
  const q = searchKey(query)
  const t = searchKey(target)
  if (!q || !t) return 0
  if (t === q) return 1
  if (t.startsWith(q)) return 0.95
  if (t.includes(q)) return 0.9
  const qWords = q.split(' ')
  const tWords = t.split(' ')
  let total = 0
  for (const qw of qWords) {
    let best = 0
    for (const tw of tWords) {
      if (tw.startsWith(qw)) best = Math.max(best, qw.length >= 2 ? 1 : 0.6)
      else best = Math.max(best, similarity(qw, tw.slice(0, Math.max(qw.length, Math.min(tw.length, qw.length + 2)))))
    }
    total += best
  }
  const score = total / qWords.length
  return score >= 0.72 ? score * 0.88 : 0
}

/** True when normalisation changed more than letter case / spacing. */
export function spellingChanged(raw: string, normalized: string): boolean {
  const a = collapseSpaces(raw).toLowerCase().replace(/[^a-z0-9]/g, '')
  const b = collapseSpaces(normalized).toLowerCase().replace(/[^a-z0-9]/g, '')
  return a !== b
}
