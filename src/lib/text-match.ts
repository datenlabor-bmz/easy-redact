// Small/local models frequently "quote" text they read rather than copying it
// verbatim, drifting in ways that are semantically irrelevant but break exact
// string search: case, accents (Müller/Mueller/Muller), "&" vs "and"/"und",
// and the occasional one-letter spelling slip (Meier/Meyer). This module finds
// the closest actual occurrence of such a mistyped needle inside a haystack so
// callers can search the document for text that is guaranteed to really be
// there, instead of failing outright on a near-exact miss.

interface Token { text: string; start: number; end: number }

const CONNECTOR_WORDS = new Set(['and', 'und', 'et', 'y'])

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalizeToken(raw: string): string {
  if (raw === '&') return '&'
  let t = stripDiacritics(raw.toLowerCase())
  t = t.replace(/ue/g, 'u').replace(/oe/g, 'o').replace(/ae/g, 'a').replace(/ß/g, 'ss')
  return CONNECTOR_WORDS.has(t) ? '&' : t
}

const WORD_RE = /[\p{L}\p{N}]+|&/gu

function tokenize(s: string): Token[] {
  const tokens: Token[] = []
  for (const m of s.matchAll(WORD_RE)) {
    tokens.push({ text: normalizeToken(m[0]), start: m.index!, end: m.index! + m[0].length })
  }
  return tokens
}

// Bounded Levenshtein distance — only ever called on short name-length tokens,
// so the O(n*m) table is cheap.
function editDistance(a: string, b: string): number {
  const dp: number[] = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = tmp
    }
  }
  return dp[b.length]
}

function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true
  if (a === '&' || b === '&') return false
  // Only tolerate a spelling slip on longer tokens — short tokens (e.g. "am"/
  // "an") are too easy to confuse with an unrelated word one edit away.
  const maxDist = Math.min(2, Math.floor(Math.min(a.length, b.length) / 4))
  if (maxDist <= 0) return false
  if (Math.abs(a.length - b.length) > maxDist) return false
  return editDistance(a, b) <= maxDist
}

/**
 * Finds the best-effort location of `needle` inside `haystack` and returns the
 * exact original substring of `haystack` that matches it, or null if nothing
 * close enough is found. Matching is done at the token (word) level after
 * normalizing case, accents, ue/oe/ae ↔ ü/ö/ä and "&"/"and"/"und" so those
 * differences never prevent a match, while still requiring every word to line
 * up in order.
 */
export function findFuzzyMatch(haystack: string, needle: string): string | null {
  const needleTokens = tokenize(needle)
  if (!needleTokens.length) return null
  const hayTokens = tokenize(haystack)
  if (hayTokens.length < needleTokens.length) return null

  for (let start = 0; start <= hayTokens.length - needleTokens.length; start++) {
    let ok = true
    for (let j = 0; j < needleTokens.length; j++) {
      if (!tokensMatch(hayTokens[start + j].text, needleTokens[j].text)) { ok = false; break }
    }
    if (ok) {
      const first = hayTokens[start]
      const last = hayTokens[start + needleTokens.length - 1]
      return haystack.slice(first.start, last.end)
    }
  }
  return null
}
