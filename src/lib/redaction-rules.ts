import type { JurisdictionMeta, RedactionRule } from '@/types'

const GITHUB_INDEX = 'https://raw.githubusercontent.com/datenlabor-bmz/redaction-rules/refs/heads/main/rules.json'
const GITHUB_RULES = 'https://raw.githubusercontent.com/datenlabor-bmz/redaction-rules/main/rules'

const isServer = typeof window === 'undefined'

// Source of the FOI rule sets: 'local' serves the JSON bundled in src/data/rules,
// 'github' fetches from the datenlabor-bmz/redaction-rules repo (default).
// Only evaluated on the server — the browser always proxies through /api/rules,
// so the API route decides the source in one place.
const useLocalRules = () => (process.env.REDACTION_RULES_SOURCE ?? 'github').toLowerCase() === 'local'

interface RulesIndexFile { rules: JurisdictionMeta[] }
interface RuleFile { rules: RedactionRule[] }

// ── Raw file loaders (server-side) ──────────────────────────────────────────────
// These return the same JSON shape the GitHub repo serves, regardless of source,
// so both the /api/rules proxy and server components can share them.

export async function loadRulesIndex(): Promise<RulesIndexFile> {
  if (useLocalRules()) {
    return (await import('../data/rules/index.json')).default as RulesIndexFile
  }
  const res = await fetch(GITHUB_INDEX)
  if (!res.ok) throw new Error(`Failed to fetch rules index: ${res.status}`)
  return res.json()
}

export async function loadRuleFile(id: string): Promise<RuleFile | null> {
  if (useLocalRules()) {
    try {
      return (await import(`../data/rules/${id}.json`)).default as RuleFile
    } catch {
      return null
    }
  }
  const res = await fetch(`${GITHUB_RULES}/${id}.json`)
  if (!res.ok) return null
  return res.json()
}

// ── Cached high-level getters (server + client) ─────────────────────────────────

let jurisdictions: JurisdictionMeta[] | null = null
const rulesCache = new Map<string, RedactionRule[]>()

export async function getJurisdictions(): Promise<JurisdictionMeta[]> {
  if (jurisdictions) return jurisdictions
  let data: RulesIndexFile
  if (isServer) {
    data = await loadRulesIndex()
  } else {
    const res = await fetch('/api/rules')
    if (!res.ok) throw new Error(`Failed to fetch rules index: ${res.status}`)
    data = await res.json()
  }
  jurisdictions = data.rules
  return jurisdictions
}

export async function getRulesForJurisdiction(jurisdictionId: string): Promise<RedactionRule[]> {
  if (rulesCache.has(jurisdictionId)) return rulesCache.get(jurisdictionId)!
  let data: RuleFile | null
  if (isServer) {
    data = await loadRuleFile(jurisdictionId)
  } else {
    const res = await fetch(`/api/rules?id=${jurisdictionId}`)
    data = res.ok ? await res.json() : null
  }
  if (!data) throw new Error(`Failed to fetch rules for ${jurisdictionId}`)
  rulesCache.set(jurisdictionId, data.rules)
  return data.rules
}
