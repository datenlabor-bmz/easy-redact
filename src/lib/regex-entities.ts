import type { RedactionSuggestion } from '@/types'

export type RegexCategory = 'phone' | 'email' | 'iban' | 'date' | 'id'

const PATTERNS: Record<RegexCategory, { pattern: RegExp; personGroup: string }> = {
  phone: {
    pattern: /(?:\+49[\s.-]?\(?\d{2,5}\)?[\s.-]?\d{3,}[\s.-]?\d{0,6}|\b0\d{2,4}[\s/.-]\d{3,}[\s/.-]?\d{0,6}\b)/g,
    personGroup: 'Telefonnummern',
  },
  email: {
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    personGroup: 'E-Mail-Adressen',
  },
  iban: {
    pattern: /\b[A-Z]{2}\d{2}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{0,2}\b/g,
    personGroup: 'Bankverbindungen',
  },
  date: {
    pattern: /\b(?:\d{1,2}[./]\d{1,2}[./]\d{2,4}|\d{4}-\d{2}-\d{2})\b/g,
    personGroup: 'Datumsangaben',
  },
  id: {
    pattern: /\b(?=[A-Za-z]*\d)(?=\d*[A-Za-z])[A-Za-z0-9]{10,}\b/g,
    personGroup: 'Kennungen',
  },
}

export const REGEX_CATEGORIES = Object.keys(PATTERNS) as RegexCategory[]

export function extractRegexEntities(
  pages: Array<{ pageIndex: number; text: string }>,
  categories: RegexCategory[] = REGEX_CATEGORIES,
): RedactionSuggestion[] {
  const suggestions: RedactionSuggestion[] = []
  const seen = new Set<string>()

  for (const { pageIndex, text } of pages) {
    if (!text.trim()) continue
    for (const cat of categories) {
      const { pattern, personGroup } = PATTERNS[cat]
      for (const match of text.matchAll(new RegExp(pattern))) {
        const key = `${pageIndex}:${match[0]}:${cat}`
        if (seen.has(key)) continue
        seen.add(key)
        suggestions.push({
          text: match[0],
          pageIndex,
          confidence: 'high',
          personGroup,
          person: undefined,
          reason: `Pattern: ${cat}`,
        })
      }
    }
  }
  return suggestions
}
