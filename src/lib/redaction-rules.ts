import type { JurisdictionMeta, RedactionRule } from '@/types'

const GITHUB_INDEX = 'https://raw.githubusercontent.com/datenlabor-bmz/redaction-rules/refs/heads/main/rules.json'
const GITHUB_RULES = 'https://raw.githubusercontent.com/datenlabor-bmz/redaction-rules/main/rules'

const isServer = typeof window === 'undefined'
const indexUrl = () => isServer ? GITHUB_INDEX : '/api/rules'
const ruleUrl = (id: string) => isServer ? `${GITHUB_RULES}/${id}.json` : `/api/rules?id=${id}`

let jurisdictions: JurisdictionMeta[] | null = null
const rulesCache = new Map<string, RedactionRule[]>()

export async function getJurisdictions(): Promise<JurisdictionMeta[]> {
  if (jurisdictions) return jurisdictions
  const res = await fetch(indexUrl())
  if (!res.ok) throw new Error(`Failed to fetch rules index: ${res.status}`)
  const data = await res.json()
  jurisdictions = data.rules as JurisdictionMeta[]
  return jurisdictions
}

export async function getRulesForJurisdiction(jurisdictionId: string): Promise<RedactionRule[]> {
  if (rulesCache.has(jurisdictionId)) return rulesCache.get(jurisdictionId)!
  const res = await fetch(ruleUrl(jurisdictionId))
  if (!res.ok) throw new Error(`Failed to fetch rules for ${jurisdictionId}: ${res.status}`)
  const data = await res.json()
  const rules = data.rules as RedactionRule[]
  rulesCache.set(jurisdictionId, rules)
  return rules
}
