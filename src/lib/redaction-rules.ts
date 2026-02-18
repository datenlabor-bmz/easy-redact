import type { JurisdictionMeta, RedactionRule } from '@/types'

const INDEX_URL = 'https://raw.githubusercontent.com/datenlabor-bmz/redaction-rules/refs/heads/main/rules.json'

// Module-level caches
let jurisdictions: JurisdictionMeta[] | null = null
const rulesCache = new Map<string, RedactionRule[]>()

export async function getJurisdictions(): Promise<JurisdictionMeta[]> {
  if (jurisdictions) return jurisdictions
  const res = await fetch(INDEX_URL)
  if (!res.ok) throw new Error(`Failed to fetch rules index: ${res.status}`)
  const data = await res.json()
  jurisdictions = data.rules as JurisdictionMeta[]
  return jurisdictions
}

export async function getRulesForJurisdiction(jurisdictionId: string): Promise<RedactionRule[]> {
  if (rulesCache.has(jurisdictionId)) return rulesCache.get(jurisdictionId)!
  const juris = await getJurisdictions()
  const meta = juris.find(j => j.id === jurisdictionId)
  if (!meta) throw new Error(`Unknown jurisdiction: ${jurisdictionId}`)
  const res = await fetch(meta.url)
  if (!res.ok) throw new Error(`Failed to fetch rules for ${jurisdictionId}: ${res.status}`)
  const data = await res.json()
  const rules = data.rules as RedactionRule[]
  rulesCache.set(jurisdictionId, rules)
  return rules
}
