'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Brain, Loader2, User, Building2, MapPin, Phone, Mail, Landmark, CalendarDays, Hash, Check } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { DocumentPage, Redaction, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion } from '@/types'
import type { RegexCategory } from '@/lib/regex-entities'

type NerCategory = 'PER' | 'ORG' | 'LOC'
type CategoryKey = `ner:${NerCategory}` | `regex:${RegexCategory}`

const NER_REASON: Record<NerCategory, string> = { PER: 'Erkannte Entität: PER', ORG: 'Erkannte Entität: ORG', LOC: 'Erkannte Entität: LOC' }
const REGEX_REASON: Record<RegexCategory, string> = { phone: 'Pattern: phone', email: 'Pattern: email', iban: 'Pattern: iban', date: 'Pattern: date', id: 'Pattern: id' }

function reasonForKey(key: CategoryKey): string {
  const ner = key.startsWith('ner:') ? NER_REASON[key.slice(4) as NerCategory] : undefined
  return ner ?? REGEX_REASON[key.slice(6) as RegexCategory]
}

const NER_OPTIONS: Array<{ key: CategoryKey; icon: React.ElementType; labelKey: string }> = [
  { key: 'ner:PER', icon: User, labelKey: 'persons' },
  { key: 'ner:ORG', icon: Building2, labelKey: 'organizations' },
  { key: 'ner:LOC', icon: MapPin, labelKey: 'locations' },
]

const REGEX_OPTIONS: Array<{ key: CategoryKey; icon: React.ElementType; labelKey: string }> = [
  { key: 'regex:phone', icon: Phone, labelKey: 'phone' },
  { key: 'regex:email', icon: Mail, labelKey: 'email' },
  { key: 'regex:iban', icon: Landmark, labelKey: 'iban' },
  { key: 'regex:date', icon: CalendarDays, labelKey: 'date' },
  { key: 'regex:id', icon: Hash, labelKey: 'id' },
]

const spacyEnabled = process.env.NEXT_PUBLIC_SPACY_ENABLED === 'true'

interface NlpPanelProps {
  documentPages?: DocumentPage[]
  redactions?: Redaction[]
  onSuggestionsReceived: (suggestions: RedactionSuggestion[], textRanges: TextRangeSuggestion[], pageRanges: PageRangeSuggestion[], remove: string[]) => void
  onRemoveByReason: (reason: string) => void
  onRestoreByReason: (reason: string) => void
}

export function NlpPanel({ documentPages, redactions, onSuggestionsReceived, onRemoveByReason, onRestoreByReason }: NlpPanelProps) {
  const t = useTranslations('NlpPanel')
  const [enabled, setEnabled] = useState<Set<CategoryKey>>(() => {
    const s = new Set<CategoryKey>(REGEX_OPTIONS.map(o => o.key))
    if (spacyEnabled) NER_OPTIONS.forEach(o => s.add(o.key))
    return s
  })
  const [allResults, setAllResults] = useState<RedactionSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const analyzedPageCount = useRef(0)

  const countFor = (key: CategoryKey) => allResults.filter(s => s.reason === reasonForKey(key)).length

  const toggle = useCallback((key: CategoryKey) => {
    const reason = reasonForKey(key)
    const wasEnabled = enabled.has(key)
    setEnabled(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
    queueMicrotask(() => {
      if (wasEnabled) {
        onRemoveByReason(reason)
      } else {
        onRestoreByReason(reason)
        const toAdd = allResults.filter(s => s.reason === reason)
        if (toAdd.length) onSuggestionsReceived(toAdd, [], [], [])
      }
    })
  }, [enabled, allResults, onRemoveByReason, onRestoreByReason, onSuggestionsReceived])

  // Auto-run when new pages appear
  useEffect(() => {
    const pageCount = documentPages?.length ?? 0
    if (!pageCount || pageCount <= analyzedPageCount.current || loading) return
    analyzedPageCount.current = pageCount
    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/nlp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pages: documentPages }),
    })
      .then(r => r.json())
      .then(({ suggestions }) => {
        setAllResults(suggestions)
        onSuggestionsReceived(suggestions, [], [], [])
      })
      .finally(() => setLoading(false))
  }, [documentPages, loading, onSuggestionsReceived])

  const activeReasons = new Set([...enabled].map(reasonForKey))
  const totalActive = allResults.filter(s => activeReasons.has(s.reason!)).length

  const renderOption = ({ key, icon: Icon, labelKey }: { key: CategoryKey; icon: React.ElementType; labelKey: string }) => {
    const active = enabled.has(key)
    const count = countFor(key)
    return (
      <button key={key} onClick={() => toggle(key)}
        className='flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors hover:bg-muted/80 text-foreground w-full'>
        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
          active ? 'bg-primary border-primary' : 'border-border'
        }`}>
          {active && <Check className='h-3 w-3 text-primary-foreground' />}
        </div>
        <Icon className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
        <span className='flex-1'>{t(labelKey)}</span>
        {allResults.length > 0 && (
          <span className={`text-[10px] tabular-nums ${count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground/50'}`}>{count}</span>
        )}
      </button>
    )
  }

  return (
    <div className='flex flex-col h-full bg-card'>
      <div className='shrink-0 h-11 flex items-center gap-1.5 px-3 border-b bg-muted/50'>
        <Brain className='h-3.5 w-3.5 text-muted-foreground' />
        <span className='text-xs font-medium text-foreground'>{t('header')}</span>
        {loading && <Loader2 className='h-3 w-3 animate-spin text-muted-foreground ml-auto' />}
        {!loading && allResults.length > 0 && (
          <span className='ml-auto text-[10px] text-muted-foreground tabular-nums'>
            {t('result', { count: totalActive })}
          </span>
        )}
      </div>

      <div className='flex-1 overflow-y-auto p-3 space-y-4'>
        {spacyEnabled && (
          <section>
            <p className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1'>{t('nerSection')}</p>
            <div className='flex flex-col'>{NER_OPTIONS.map(renderOption)}</div>
          </section>
        )}

        <section>
          <p className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1 px-1'>{t('patternSection')}</p>
          <div className='flex flex-col'>{REGEX_OPTIONS.map(renderOption)}</div>
        </section>

        {!documentPages?.length && !loading && (
          <p className='text-[10px] text-muted-foreground text-center py-4'>{t('noDocument')}</p>
        )}
      </div>
    </div>
  )
}
