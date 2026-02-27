'use client'

import { useEffect, useRef, useState } from 'react'
import type { Redaction, PageData, HighlightInProgress, WordData, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion, RedactionRule, RedactionMode, RedactionPart } from '@/types'
import { useMupdf } from './useMupdf'
import { finalizeHighlight, redactionsToAnnotations, quadToPart, generateUUID } from './geometry'
import { PdfPage } from './PdfPage'
import { RuleSelectorOverlay } from './RuleSelectorOverlay'
import { MetadataPanel } from './MetadataPanel'
import { Loader2 } from 'lucide-react'

export interface PdfViewerProps {
  file: File
  redactions: Redaction[]
  selectedId: string | null
  zoom: number
  onRedactionAdd: (r: Redaction) => void
  onRedactionRemove: (id: string) => void
  onRedactionUpdate: (id: string, updates: Partial<Redaction>) => void
  onAccept?: (id: string) => void
  onIgnore?: (id: string) => void
  onSelectionChange: (id: string | null) => void
  onZoomChange: (zoom: number) => void
  onExport: (blob: Blob, applied: boolean) => void
  documentKey?: string
  documentName?: string
  onPageTextExtracted?: (text: string, pageIndex: number, documentKey: string) => void
  onPagesLoaded?: (pages: PageData[]) => void
  pendingSuggestions?: RedactionSuggestion[]
  pendingTextRanges?: TextRangeSuggestion[]
  pendingPageRanges?: PageRangeSuggestion[]
  onSuggestionsApplied?: () => void
  exportRef?: React.MutableRefObject<((apply: boolean) => void) | null>
  foiRules?: RedactionRule[]
  redactionMode?: RedactionMode
  searchQuery?: string
  onSearchInfoChange?: (info: { current: number, total: number }) => void
  searchNavigateRef?: React.MutableRefObject<((dir: 1|-1) => void) | null>
  selectMode?: 'text' | 'freehand'
}

export function PdfViewer({
  file, redactions, selectedId, zoom, onRedactionAdd, onRedactionRemove,
  onRedactionUpdate, onSelectionChange, onZoomChange, onExport,
  documentKey, documentName,
  onPageTextExtracted, onPagesLoaded, pendingSuggestions, pendingTextRanges, pendingPageRanges,
  onSuggestionsApplied, exportRef,
  onAccept, onIgnore, foiRules, redactionMode,
  searchQuery, onSearchInfoChange, searchNavigateRef, selectMode = 'text',
}: PdfViewerProps) {
  const { isWorkerInitialized, renderPage, loadDocumentAndAnnotations, countPages,
    getPageContent, getPageBounds, getPageWords, getMetadata, getRedactedDocument, searchPage } = useMupdf()

  const [pages, setPages] = useState<PageData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentHighlight, setCurrentHighlight] = useState<HighlightInProgress | null>(null)
  const [metadata, setMetadata] = useState<Record<string, string>>({})
  const [fieldsToRemove, setFieldsToRemove] = useState<Set<string>>(new Set())
  const [searchMatches, setSearchMatches] = useState<Map<number, RedactionPart[][]>>(new Map())
  const [searchMatchIdx, setSearchMatchIdx] = useState(0)
  const searchFlatRef = useRef<{ pageIndex: number, matchIdx: number }[]>([])
  const pdfViewerRef = useRef<HTMLDivElement>(null)
  const rerenderTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragRef = useRef<{ rect: DOMRect; pw: number; ph: number; pageIndex: number } | null>(null)
  const currentHighlightRef = useRef<HighlightInProgress | null>(null)
  useEffect(() => { currentHighlightRef.current = currentHighlight }, [currentHighlight])

  // Re-render page images at the new zoom resolution (debounced)
  useEffect(() => {
    if (!pages.length) return
    if (rerenderTimerRef.current) clearTimeout(rerenderTimerRef.current)
    rerenderTimerRef.current = setTimeout(async () => {
      const zoomFactor = zoom / 100
      const updated = await Promise.all(pages.map(async (page, i) => {
        URL.revokeObjectURL(page.image)
        const pngData = await renderPage(i, zoomFactor)
        return { ...page, image: URL.createObjectURL(new Blob([new Uint8Array(pngData)], { type: 'image/png' })) }
      }))
      setPages(updated)
    }, 300)
  }, [zoom])

  // Search across all pages (debounced)
  useEffect(() => {
    if (!searchQuery?.trim() || !pages.length) {
      setSearchMatches(new Map())
      searchFlatRef.current = []
      onSearchInfoChange?.({ current: 0, total: 0 })
      return
    }
    const timer = setTimeout(() => {
      Promise.all(pages.map(async (_, i) => {
        const quads = await searchPage(i, searchQuery) as number[][][]
        return [i, quads.map(matchQuads => matchQuads.map(q => quadToPart(q)))] as const
      })).then(results => {
        const withMatches = results.filter(([, v]) => v.length > 0)
        const map = new Map(withMatches)
        const flat = withMatches.flatMap(([pageIndex, matches]) =>
          matches.map((_, matchIdx) => ({ pageIndex, matchIdx }))
        )
        setSearchMatches(map)
        searchFlatRef.current = flat
        setSearchMatchIdx(0)
        onSearchInfoChange?.({ current: flat.length > 0 ? 1 : 0, total: flat.length })
        if (flat.length > 0) scrollToPage(flat[0].pageIndex)
      })
    }, 200)
    return () => clearTimeout(timer)
  }, [searchQuery, pages.length])

  // Wire navigation to searchNavigateRef
  useEffect(() => {
    if (!searchNavigateRef) return
    searchNavigateRef.current = (dir: 1|-1) => {
      const flat = searchFlatRef.current
      if (!flat.length) return
      setSearchMatchIdx(prev => {
        const next = ((prev + dir) % flat.length + flat.length) % flat.length
        onSearchInfoChange?.({ current: next + 1, total: flat.length })
        scrollToPage(flat[next].pageIndex)
        return next
      })
    }
  })

  // Load document
  useEffect(() => {
    if (!isWorkerInitialized || !file) return

    const init = async () => {
      setPages([])
      setMetadata({})
      setFieldsToRemove(new Set())
      setIsLoading(true)
      const buf = await file.arrayBuffer()
      const existing = await loadDocumentAndAnnotations(buf)
      existing.forEach((ann: any) => {
        const parts = ann.quads.map((q: number[]) => quadToPart(q))
        onRedactionAdd({ id: generateUUID(), documentKey: '', pageIndex: ann.pageIndex, parts, status: 'suggested', confidence: 'high', shouldApply: true })
      })

      const total = await countPages()
      const stack: PageData[] = []
      for (let i = 0; i < total; i++) {
        const pngData = await renderPage(i)
        const content = JSON.parse(await getPageContent(i))
        const lines = content.blocks.flatMap((b: any) => b.lines)
        const words = await getPageWords(i)
        if (onPageTextExtracted) {
          const text = lines.map((l: any) => l.text ?? l.spans?.map((s: any) => s.text).join('') ?? '').join(' ')
          onPageTextExtracted(text, i, documentKey ?? '')
        }
        stack.push({
          image: URL.createObjectURL(new Blob([new Uint8Array(pngData)], { type: 'image/png' })),
          bounds: await getPageBounds(i),
          content, lines, words,
        })
      }
      setPages(stack)
      onPagesLoaded?.(stack)
      const meta = await getMetadata()
      setMetadata(meta)
      setFieldsToRemove(new Set(Object.keys(meta)))
      setIsLoading(false)
    }
    init()
  }, [isWorkerInitialized, file])

  // Apply AI suggestions by searching text in PDF
  useEffect(() => {
    if (!pendingSuggestions?.length || !pages.length) return
    ;(async () => {
      const existingTexts = redactions
        .filter(r => r.searchText && r.status !== 'ignored')
        .map(r => ({ page: r.pageIndex, text: r.searchText! }))
      const processedTexts: Array<{ page: number; text: string }> = []

      const isSubsumed = (page: number, text: string) =>
        [...existingTexts, ...processedTexts].some(e =>
          e.page === page && (e.text.includes(text) || text.includes(e.text)))

      for (const s of pendingSuggestions) {
        if (isSubsumed(s.pageIndex, s.text)) continue
        processedTexts.push({ page: s.pageIndex, text: s.text })
        const quads = await searchPage(s.pageIndex, s.text)
        if (quads.length === 0) continue
        for (const matchQuads of quads as number[][][]) {
          const parts = matchQuads.map(q => quadToPart(q as number[]))
          onRedactionAdd({
            id: generateUUID(), documentKey: '', pageIndex: s.pageIndex, parts,
            searchText: s.text,
            status: 'suggested', confidence: s.confidence,
            person: s.person, personGroup: s.personGroup,
            rule: s.rule, reason: s.reason,
            isAutoGenerated: true, shouldApply: true,
          })
        }
      }
      onSuggestionsApplied?.()
    })()
  }, [pendingSuggestions])

  // Apply text-range and page-range suggestions
  useEffect(() => {
    const hasRanges = (pendingTextRanges?.length ?? 0) + (pendingPageRanges?.length ?? 0)
    if (!hasRanges || !pages.length) return
    ;(async () => {
      const pageRect = (p: number) => {
        const b = pages[p]?.bounds
        if (!b) return null
        return { x: b[0], y: b[1], width: b[2] - b[0], height: b[3] - b[1] }
      }
      const addFull = (p: number, meta: Omit<Redaction, 'id' | 'documentKey' | 'pageIndex' | 'parts'>) => {
        const r = pageRect(p)
        if (!r) return
        onRedactionAdd({ id: generateUUID(), documentKey: '', pageIndex: p, parts: [r], ...meta })
      }

      for (const pr of pendingPageRanges ?? []) {
        const label = `[Seiten ${pr.fromPage + 1}–${pr.toPage + 1}]`
        const base = { searchText: label, status: 'suggested' as const, confidence: pr.confidence, person: pr.person, personGroup: pr.personGroup, reason: pr.reason, rule: pr.rule, isAutoGenerated: true, shouldApply: true }
        for (let p = pr.fromPage; p <= pr.toPage; p++) addFull(p, base)
      }

      for (const tr of pendingTextRanges ?? []) {
        const label = `[Bereich: "${tr.startText}"→"${tr.endText}"]`
        const base = { searchText: label, status: 'suggested' as const, confidence: tr.confidence, person: tr.person, personGroup: tr.personGroup, reason: tr.reason, rule: tr.rule, isAutoGenerated: true, shouldApply: true }
        const startQuads = await searchPage(tr.startPage, tr.startText) as number[][][]
        const endQuads = await searchPage(tr.endPage, tr.endText) as number[][][]
        const rect0 = pageRect(tr.startPage)
        const rectN = pageRect(tr.endPage)
        if (!rect0 || !rectN) continue

        const startY = startQuads[0]?.[0]?.[1] ?? rect0.y
        const endY = endQuads.length
          ? Math.max(...(endQuads.flat() as number[][]).map(q => q[5] ?? q[3]))
          : rectN.y + rectN.height

        if (tr.startPage === tr.endPage) {
          onRedactionAdd({ id: generateUUID(), documentKey: '', pageIndex: tr.startPage, parts: [{ x: rect0.x, y: startY, width: rect0.width, height: Math.max(endY - startY, 4) }], ...base })
        } else {
          onRedactionAdd({ id: generateUUID(), documentKey: '', pageIndex: tr.startPage, parts: [{ x: rect0.x, y: startY, width: rect0.width, height: rect0.y + rect0.height - startY }], ...base })
          for (let p = tr.startPage + 1; p < tr.endPage; p++) addFull(p, base)
          onRedactionAdd({ id: generateUUID(), documentKey: '', pageIndex: tr.endPage, parts: [{ x: rectN.x, y: rectN.y, width: rectN.width, height: endY - rectN.y }], ...base })
        }
      }
      onSuggestionsApplied?.()
    })()
  }, [pendingTextRanges, pendingPageRanges])

  const scrollToPage = (idx: number) => {
    const el = pdfViewerRef.current?.querySelectorAll('[data-page-index]')[idx] as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>, pageIndex: number) => {
    if ((e.target as Element).closest('g[data-highlight="true"]')) return
    const page = pages[pageIndex]
    const [, , pw, ph] = page.bounds
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) * (pw / rect.width)
    const y = (e.clientY - rect.top) * (ph / rect.height)
    const startWord = page.words.find((w: WordData) => x >= w.bbox.x0 && x <= w.bbox.x1 && y >= w.bbox.y0 && y <= w.bbox.y1) ?? null
    if (selectMode === 'text' && !startWord) return
    dragRef.current = { rect, pw, ph, pageIndex }
    const type = selectMode === 'freehand' ? 'freehand' : (startWord ? 'text' : 'freehand')
    setCurrentHighlight({ pageIndex, type, startX: x, startY: y, endX: x, endY: y, startWord, endWord: startWord })
  }

  useEffect(() => {
    if (!currentHighlight) return
    const drag = dragRef.current!
    const page = pages[drag.pageIndex]

    const onMove = (e: MouseEvent) => {
      const cx = Math.max(0, Math.min((e.clientX - drag.rect.left) * (drag.pw / drag.rect.width), drag.pw))
      const cy = Math.max(0, Math.min((e.clientY - drag.rect.top) * (drag.ph / drag.rect.height), drag.ph))
      setCurrentHighlight(prev => {
        if (!prev) return null
        const endWord = prev.type === 'text'
          ? (page.words.find((w: WordData) => cx >= w.bbox.x0 && cx <= w.bbox.x1 && cy >= w.bbox.y0 && cy <= w.bbox.y1) ?? prev.endWord)
          : prev.endWord
        return { ...prev, endX: cx, endY: cy, endWord }
      })
    }

    const onUp = () => {
      const hl = currentHighlightRef.current
      if (hl) {
        const r = finalizeHighlight(pages[hl.pageIndex], hl)
        if (hl.type !== 'freehand' || r.parts[0].width * r.parts[0].height >= 100) onRedactionAdd(r)
      }
      setCurrentHighlight(null)
      dragRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!currentHighlight])

  const handleExport = async (apply: boolean) => {
    const annotations = redactionsToAnnotations(redactions)
    const blob = await getRedactedDocument(annotations, apply, [...fieldsToRemove])
    onExport(blob, apply)
  }

  // Expose export trigger to parent via ref
  useEffect(() => { if (exportRef) exportRef.current = handleExport })

  if (isLoading) return (
    <div className='flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground bg-muted'>
      <Loader2 className='h-8 w-8 animate-spin' />
      <p className='text-sm'>PDF wird geladen…</p>
    </div>
  )

  const selectedRedaction = selectedId ? redactions.find(r => r.id === selectedId) : null
  const showRuleOverlay = redactionMode === 'foi' && foiRules?.length && selectedRedaction

  return (
    <div className='flex flex-col flex-1 min-h-0'>
      {/* Pages */}
      <div ref={pdfViewerRef} className='flex-1 overflow-auto bg-muted relative'>
        <div className='flex flex-col items-center min-w-max'>
        <MetadataPanel metadata={metadata} fieldsToRemove={fieldsToRemove} onChange={setFieldsToRemove} />
        {pages.map((page, i) => {
          const currentFlat = searchFlatRef.current[searchMatchIdx]
          return (
            <PdfPage key={i} pageIndex={i} pageData={page} zoom={zoom} redactions={redactions}
              selectedId={selectedId} currentHighlight={currentHighlight}
              onRedactionClick={(id, e) => { e.stopPropagation(); onSelectionChange(id) }}
              onMouseDown={handleMouseDown}
              onAccept={onAccept} onIgnore={onIgnore}
              searchMatches={searchMatches.get(i)}
              searchCurrentMatch={currentFlat?.pageIndex === i ? currentFlat.matchIdx : -1}
              selectMode={selectMode} />
          )
        })}
        {showRuleOverlay && selectedRedaction && (
          <RuleSelectorOverlay
            redaction={selectedRedaction}
            pageIndex={selectedRedaction.pageIndex}
            pageWidth={pages[selectedRedaction.pageIndex]?.bounds[2] ?? 595}
            pageHeight={pages[selectedRedaction.pageIndex]?.bounds[3] ?? 842}
            zoom={zoom}
            foiRules={foiRules!}
            containerRef={pdfViewerRef as React.RefObject<HTMLDivElement>}
            onRuleSelect={rule => onRedactionUpdate(selectedRedaction.id, { rule })}
            onClose={() => onSelectionChange(null)}
          />
        )}
        </div>
      </div>
    </div>
  )
}
