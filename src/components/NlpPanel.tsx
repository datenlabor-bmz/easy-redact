'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Brain, Loader2, User, Building2, MapPin, Phone, Mail, Landmark, CalendarDays, Hash, Check, AlertCircle, RotateCcw, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { DocumentPage, Redaction, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion } from '@/types'
import type { RegexCategory } from '@/lib/regex-entities'
import { extractRegexEntities } from '@/lib/regex-entities'
import { localBackend } from '@/lib/config'
import type { ModelStatus, ProgressEvent } from '@/lib/browser-nlp'

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

const nerEnabled = localBackend === 'spacy' || localBackend === 'browser'
const isBrowser = localBackend === 'browser'

interface NlpPanelProps {
  documentPages?: DocumentPage[]
  redactions?: Redaction[]
  onSuggestionsReceived: (suggestions: RedactionSuggestion[], textRanges: TextRangeSuggestion[], pageRanges: PageRangeSuggestion[], remove: string[]) => void
  onRemoveByReason: (reason: string) => void
  onRestoreByReason: (reason: string) => void
  modeSelector?: React.ReactNode
}

export function NlpPanel({ documentPages, redactions, onSuggestionsReceived, onRemoveByReason, onRestoreByReason, modeSelector }: NlpPanelProps) {
  const t = useTranslations('NlpPanel')
  const [enabled, setEnabled] = useState<Set<CategoryKey>>(() => {
    const s = new Set<CategoryKey>(['regex:phone', 'regex:email', 'regex:iban'])
    if (nerEnabled) s.add('ner:PER')
    return s
  })
  const [allResults, setAllResults] = useState<RedactionSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [modelStatus, setModelStatus] = useState<ModelStatus>(isBrowser ? 'idle' : 'ready')
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [inferenceProgress, setInferenceProgress] = useState<{ current: number; total: number } | null>(null)
  const analyzedKeys = useRef(new Set<string>())
  const pendingPages = useRef<DocumentPage[]>([])

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

  // Load browser NLP model eagerly
  useEffect(() => {
    if (!isBrowser || modelStatus !== 'idle') return
    setModelStatus('loading')
    let hasProgress = false
    import('@/lib/browser-nlp').then(({ loadBrowserNlpModel }) =>
      loadBrowserNlpModel((e: ProgressEvent) => {
        if (e.status === 'progress') {
          if (!hasProgress) { setModelStatus('downloading'); hasProgress = true }
          setDownloadProgress(Math.round((e as { progress: number }).progress))
        } else if (e.status === 'ready') {
          setModelStatus('ready')
        }
      })
    ).catch(() => setModelStatus('error'))
  }, [modelStatus])

  const retryModelLoad = useCallback(() => setModelStatus('idle'), [])

  // Run analysis when new pages appear
  const runAnalysis = useCallback(async (newPages: DocumentPage[], enabledSet: Set<CategoryKey>) => {
    const indexMap = newPages.map((p, i) => ({ tempIdx: i, documentKey: p.documentKey, realPageIndex: p.pageIndex }))
    const apiPages = newPages.map((p, i) => ({ pageIndex: i, text: p.text }))

    let nerSuggestions: RedactionSuggestion[] = []
    let regexSuggestions: RedactionSuggestion[] = []

    if (isBrowser) {
      const { analyzePagesInBrowser } = await import('@/lib/browser-nlp')
      setInferenceProgress({ current: 0, total: apiPages.length })
      nerSuggestions = await analyzePagesInBrowser(apiPages, (pageIndex) => {
        setInferenceProgress(prev => prev ? { ...prev, current: pageIndex + 1 } : null)
      })
      regexSuggestions = extractRegexEntities(apiPages)
      setInferenceProgress(null)

      // Deduplicate: prefer NER over regex for same text on same page
      const nerTexts = new Set(nerSuggestions.map(s => `${s.pageIndex}:${s.text}`))
      const merged = [...nerSuggestions, ...regexSuggestions.filter(s => !nerTexts.has(`${s.pageIndex}:${s.text}`))]

      const tagged = merged.map(s => {
        const entry = indexMap[s.pageIndex]
        return { ...s, pageIndex: entry.realPageIndex, documentKey: entry.documentKey }
      })
      setAllResults(prev => [...prev, ...tagged])
      const activeReasons = new Set([...enabledSet].map(reasonForKey))
      const filtered = tagged.filter(s => activeReasons.has(s.reason!))
      if (filtered.length) onSuggestionsReceived(filtered, [], [], [])
    } else {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/nlp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pages: apiPages }),
      })
      const { suggestions }: { suggestions: RedactionSuggestion[] } = await res.json()
      const tagged = suggestions.map(s => {
        const entry = indexMap[s.pageIndex]
        return { ...s, pageIndex: entry.realPageIndex, documentKey: entry.documentKey }
      })
      setAllResults(prev => [...prev, ...tagged])
      const activeReasons = new Set([...enabledSet].map(reasonForKey))
      const filtered = tagged.filter(s => activeReasons.has(s.reason!))
      if (filtered.length) onSuggestionsReceived(filtered, [], [], [])
    }
  }, [onSuggestionsReceived])

  // Auto-run when new (unanalyzed) pages appear
  useEffect(() => {
    if (!documentPages?.length || loading) return
    if (isBrowser && modelStatus !== 'ready') {
      // Stash pages to process once model is ready
      const newPages = documentPages.filter(p => !analyzedKeys.current.has(`${p.documentKey}:${p.pageIndex}`))
      if (newPages.length) pendingPages.current = [...pendingPages.current, ...newPages]
      return
    }
    const newPages = documentPages.filter(p => !analyzedKeys.current.has(`${p.documentKey}:${p.pageIndex}`))
    if (!newPages.length) return
    newPages.forEach(p => analyzedKeys.current.add(`${p.documentKey}:${p.pageIndex}`))
    setLoading(true)
    runAnalysis(newPages, enabled).finally(() => setLoading(false))
  }, [documentPages, loading, modelStatus, runAnalysis, enabled])

  // Process stashed pages once model becomes ready
  useEffect(() => {
    if (!isBrowser || modelStatus !== 'ready' || loading || !pendingPages.current.length) return
    const pages = pendingPages.current.filter(p => !analyzedKeys.current.has(`${p.documentKey}:${p.pageIndex}`))
    pendingPages.current = []
    if (!pages.length) return
    pages.forEach(p => analyzedKeys.current.add(`${p.documentKey}:${p.pageIndex}`))
    setLoading(true)
    runAnalysis(pages, enabled).finally(() => setLoading(false))
  }, [modelStatus, loading, runAnalysis, enabled])

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

  const statusText = loading && inferenceProgress
    ? t('analyzingPage', { current: inferenceProgress.current, total: inferenceProgress.total })
    : loading ? t('running') : null

  return (
    <div className='flex flex-col h-full bg-card'>
      <div className='@container shrink-0 h-11 flex items-center gap-1.5 px-3 border-b bg-muted/50'>
        <Brain className='h-3.5 w-3.5 text-muted-foreground shrink-0' />
        <span className='text-xs font-medium text-foreground hidden @[14rem]:inline'>{t('header')}</span>
        <div className='flex items-center gap-1.5 ml-auto shrink-0'>
          {modeSelector}
          {loading && <Loader2 className='h-3 w-3 animate-spin text-muted-foreground' />}
        </div>
      </div>

      <div className='flex-1 overflow-y-auto p-3 space-y-4'>
        {/* Model loading status for browser NLP */}
        {isBrowser && modelStatus !== 'ready' && (
          <div className='rounded-md border bg-muted/30 p-3 space-y-2'>
            {modelStatus === 'error' ? (
              <div className='flex items-center gap-2'>
                <AlertCircle className='h-3.5 w-3.5 text-destructive shrink-0' />
                <span className='text-xs text-destructive flex-1'>{t('modelError')}</span>
                <button onClick={retryModelLoad} className='text-xs text-primary hover:underline flex items-center gap-1'>
                  <RotateCcw className='h-3 w-3' /> {t('retry')}
                </button>
              </div>
            ) : modelStatus === 'downloading' ? (
              <>
                <div className='flex items-center gap-2'>
                  <Download className='h-3.5 w-3.5 text-muted-foreground animate-pulse shrink-0' />
                  <span className='text-xs text-muted-foreground'>{t('modelDownloading', { progress: downloadProgress })}</span>
                </div>
                <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
                  <div className='h-full bg-primary rounded-full transition-all duration-300' style={{ width: `${downloadProgress}%` }} />
                </div>
              </>
            ) : (
              <div className='flex items-center gap-2'>
                <Loader2 className='h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0' />
                <span className='text-xs text-muted-foreground'>{t('modelLoading')}</span>
              </div>
            )}
          </div>
        )}

        {/* Inference progress */}
        {statusText && (
          <p className='text-[10px] text-muted-foreground text-center'>{statusText}</p>
        )}

        {nerEnabled && (
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
