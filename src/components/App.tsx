'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Upload, FileText, X, AlertCircle, Minus, Plus, Download, FileLock2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import { LeftSidebar } from '@/components/sidebar/LeftSidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { SettingsPopover } from '@/components/SettingsPopover'
import { saveFile, loadFile, saveSession, loadSession, saveChat, loadChat, deleteFile } from '@/lib/storage'
import { generateUUID } from '@/components/pdf/geometry'
import type { Redaction, Session, PageData, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion, ChatMessage, RedactionRule } from '@/types'
import { getRulesForJurisdiction } from '@/lib/redaction-rules'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [activeFileIdx, setActiveFileIdx] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pages, setPages] = useState<PageData[]>([])
  const [documentPages, setDocumentPages] = useState<Array<{ pageIndex: number; text: string }>>([])
  const [pendingSuggestions, setPendingSuggestions] = useState<RedactionSuggestion[]>([])
  const [pendingTextRanges, setPendingTextRanges] = useState<TextRangeSuggestion[]>([])
  const [pendingPageRanges, setPendingPageRanges] = useState<PageRangeSuggestion[]>([])
  const [foiRules, setFoiRules] = useState<RedactionRule[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const exportRef = useRef<((apply: boolean) => void) | null>(null)
  const chatTriggerRef = useRef<((msg: string) => void) | null>(null)
  const pendingChatTrigger = useRef<string | null>(null)

  // Resizable panels
  const [leftWidth, setLeftWidth] = useState(() => {
    if (typeof window === 'undefined') return 260
    return parseInt(localStorage.getItem('er-left-width') ?? '260')
  })
  const [rightWidth, setRightWidth] = useState(() => {
    if (typeof window === 'undefined') return 380
    return parseInt(localStorage.getItem('er-right-width') ?? '380')
  })
  const containerRef = useRef<HTMLDivElement>(null)

  const startDrag = useCallback((side: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startW = side === 'left' ? leftWidth : rightWidth

    const onMove = (ev: MouseEvent) => {
      const containerW = containerRef.current?.offsetWidth ?? window.innerWidth
      const delta = side === 'left' ? ev.clientX - startX : startX - ev.clientX
      const next = Math.max(160, Math.min(containerW * 0.4, startW + delta))
      if (side === 'left') { setLeftWidth(next); localStorage.setItem('er-left-width', String(Math.round(next))) }
      else { setRightWidth(next); localStorage.setItem('er-right-width', String(Math.round(next))) }
    }
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [leftWidth, rightWidth])

  useEffect(() => {
    loadSession().then(setSession)
    loadChat().then(setChatMessages)
  }, [])

  // Load FOI rules when in FOI mode + jurisdiction set
  useEffect(() => {
    if (session?.redactionMode !== 'foi' || !session.foiJurisdiction) { setFoiRules([]); return }
    getRulesForJurisdiction(session.foiJurisdiction).then(setFoiRules).catch(() => setFoiRules([]))
  }, [session?.redactionMode, session?.foiJurisdiction])

  const updateSession = useCallback((updates: Partial<Session>) => {
    setSession(prev => {
      const next = { ...prev!, ...updates }
      saveSession(next)
      return next
    })
  }, [])

  const addRedaction = useCallback((r: Redaction) => {
    setSession(prev => {
      const docKey = prev!.documents[activeFileIdx]?.idbKey ?? ''
      const next = { ...prev!, redactions: [...prev!.redactions, { ...r, documentKey: docKey }] }
      saveSession(next)
      return next
    })
  }, [activeFileIdx])

  const updateRedaction = useCallback((id: string, updates: Partial<Redaction>) => {
    setSession(prev => {
      const next = { ...prev!, redactions: prev!.redactions.map(r => r.id === id ? { ...r, ...updates } : r) }
      saveSession(next)
      return next
    })
  }, [])

  const acceptRedaction = useCallback((id: string) => {
    updateRedaction(id, { status: 'accepted', shouldApply: true })
  }, [updateRedaction])

  const ignoreRedaction = useCallback((id: string) => {
    updateRedaction(id, { status: 'ignored', shouldApply: false })
  }, [updateRedaction])

  const removeRedaction = useCallback((id: string) => {
    setSession(prev => {
      const next = { ...prev!, redactions: prev!.redactions.filter(r => r.id !== id) }
      saveSession(next)
      return next
    })
  }, [])

  const handleFiles = useCallback(async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList)
    const pdfs: File[] = []

    for (const f of arr) {
      if (f.name.endsWith('.docx') || f.type.includes('wordprocessingml')) {
        const form = new FormData()
        form.append('file', f)
        const res = await fetch('/api/docx', { method: 'POST', body: form })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          setError(data.error ?? 'DOCX-Konvertierung fehlgeschlagen')
          continue
        }
        const blob = await res.blob()
        pdfs.push(new File([blob], f.name.replace('.docx', '.pdf'), { type: 'application/pdf' }))
      } else if (f.type === 'application/pdf' || f.name.endsWith('.pdf')) {
        pdfs.push(f)
      }
    }

    if (!pdfs.length) return
    const newFiles = [...files, ...pdfs]
    setFiles(newFiles)
    setActiveFileIdx(newFiles.length - 1)
    setSelectedId(null)

    for (const pdf of pdfs) {
      const key = generateUUID()
      await saveFile(key, pdf.name, await pdf.arrayBuffer())
      updateSession({
        documents: [...(session?.documents ?? []), { name: pdf.name, idbKey: key }],
      })
    }

    const names = pdfs.map(f => f.name).join(', ')
    const consent = session?.consent
    pendingChatTrigger.current = consent
      ? `[System: Neue Dokumente hochgeladen: ${names}. Zugriff bereits erteilt. Lies die Dokumente und mache Schwärzungsvorschläge.]`
      : `[System: Neue Dokumente hochgeladen: ${names}. Bitte Dokumentenzugriff anfordern und dann analysieren.]`
    // Reset extracted pages so the effect below fires fresh
    setDocumentPages([])
  }, [files, session, updateSession])

  useEffect(() => {
    if (!session?.documents.length || files.length) return
    ;(async () => {
      const restored: File[] = []
      for (const doc of session.documents) {
        const buf = await loadFile(doc.idbKey)
        if (buf) restored.push(new File([buf], doc.name, { type: 'application/pdf' }))
      }
      if (restored.length) { setFiles(restored); setActiveFileIdx(0) }
    })()
  }, [session?.documents])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleTextExtracted = useCallback((text: string, pageIndex: number) => {
    setDocumentPages(prev => {
      const next = prev.filter(p => p.pageIndex !== pageIndex)
      return [...next, { pageIndex, text }].sort((a, b) => a.pageIndex - b.pageIndex)
    })
  }, [])

  // Fire pending chat trigger once all pages have been text-extracted
  useEffect(() => {
    if (!pendingChatTrigger.current) return
    if (!pages.length) return
    if (documentPages.length < pages.length) return
    const msg = pendingChatTrigger.current
    pendingChatTrigger.current = null
    chatTriggerRef.current?.(msg)
  }, [documentPages, pages])

  const handleExport = useCallback((blob: Blob, _applied: boolean) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const orig = files[activeFileIdx]?.name ?? 'document.pdf'
    const base = orig.replace(/\.pdf$/i, '')
    a.download = `${base}.${_applied ? 'redacted' : 'preview'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }, [files, activeFileIdx])

  const handleNavigatePage = useCallback((idx: number) => {
    const el = document.querySelectorAll('[data-page-index]')[idx] as HTMLElement
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  if (!session) return (
    <div className='flex items-center justify-center h-screen'>
      <div className='animate-pulse text-muted-foreground text-sm'>Laden…</div>
    </div>
  )

  const activeFile = files[activeFileIdx]
  const activeDocKey = session.documents[activeFileIdx]?.idbKey ?? ''
  const activeRedactions = session.redactions.filter(r => r.documentKey === activeDocKey)

  const removeFile = (i: number) => {
    const next = files.filter((_, fi) => fi !== i)
    setFiles(next)
    setActiveFileIdx(Math.min(activeFileIdx, Math.max(0, next.length - 1)))
    setSelectedId(null)
    const doc = session.documents[i]
    if (doc) {
      deleteFile(doc.idbKey)
      setSession(prev => {
        const updated = {
          ...prev!,
          documents: prev!.documents.filter((_, di) => di !== i),
          redactions: prev!.redactions.filter(r => r.documentKey !== doc.idbKey),
        }
        saveSession(updated)
        return updated
      })
    }
  }

  return (
    <div className='flex flex-col h-screen bg-background overflow-hidden'>
      {/* Header */}
      <header className='shrink-0 flex items-center gap-2 px-4 border-b bg-muted/50 h-11'>
        <div className='flex items-center gap-2 shrink-0'>
          <div className='w-7 h-7 rounded-lg bg-primary flex items-center justify-center'>
            <span className='text-primary-foreground text-xs font-bold'>E</span>
          </div>
          <span className='font-semibold text-sm'>EasyRedact</span>
        </div>
        <div className='ml-auto flex items-center gap-1'>
          <SettingsPopover session={session} onConsentChange={mode => updateSession({ consent: mode })}
            onRedactionModeChange={mode => updateSession({ redactionMode: mode })}
            onFoiJurisdictionChange={id => updateSession({ foiJurisdiction: id })}
            onModelSettingsChange={(key, value) => updateSession({ modelSettings: { ...session.modelSettings, [key]: value } })} />
          <Link href='/about'
            className='text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap'>
            Über EasyRedact
          </Link>
        </div>
      </header>

      {/* Three-panel layout */}
      <div ref={containerRef} className='flex flex-1 min-h-0 select-none'>
        {/* Left sidebar */}
        <div style={{ width: leftWidth }} className='shrink-0 flex flex-col min-w-0'>
          <LeftSidebar pages={pages} redactions={activeRedactions} selectedId={selectedId}
            onSelectRedaction={id => {
              setSelectedId(id)
              const r = activeRedactions.find(x => x.id === id)
              if (r != null) handleNavigatePage(r.pageIndex)
            }}
            onAccept={acceptRedaction} onIgnore={ignoreRedaction}
            onNavigatePage={handleNavigatePage}
            onClearAll={() => setSession(prev => {
              const next = { ...prev!, redactions: prev!.redactions.filter(r => r.documentKey !== activeDocKey) }
              saveSession(next)
              return next
            })}
            foiRules={foiRules}
            redactionMode={session.redactionMode}
            onRuleChange={(id, rule) => updateRedaction(id, { rule })} />
        </div>

        {/* Left drag handle */}
        <div onMouseDown={startDrag('left')}
          className='w-px shrink-0 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary/70 transition-colors z-10' />

        {/* Center — toolbar header + PDF viewer or upload prompt */}
        <div className='flex-1 min-w-0 flex flex-col overflow-hidden'>
          {/* Header: zoom left, export right — compact, no wrapping */}
          <div className='shrink-0 flex items-center gap-1 px-2 border-b bg-muted/50 h-11'>
            {activeFile && (
              <>
                <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setZoom(Math.max(25, zoom - 25))}>
                  <Minus className='h-3.5 w-3.5' />
                </Button>
                <span className='text-xs w-10 text-center tabular-nums'>{zoom}%</span>
                <Button variant='ghost' size='icon' className='h-7 w-7' onClick={() => setZoom(Math.min(300, zoom + 25))}>
                  <Plus className='h-3.5 w-3.5' />
                </Button>
                {error && (
                  <div className='flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded shrink-0 ml-2'>
                    <AlertCircle className='h-3 w-3' /> {error}
                    <button onClick={() => setError(null)}><X className='h-3 w-3' /></button>
                  </div>
                )}
                <div className='flex gap-1 ml-auto shrink-0'>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant='outline' size='sm' className='h-6 gap-1 text-xs px-2' onClick={() => exportRef.current?.(false)}>
                        <Download className='h-3 w-3' /> Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom' className='max-w-56 text-center'>
                      PDF mit sichtbaren gelben Markierungen — zum Prüfen und Abstimmen
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button size='sm' className='h-6 gap-1 text-xs px-2' onClick={() => exportRef.current?.(true)}>
                        <FileLock2 className='h-3 w-3' /> Schwärzen
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side='bottom' className='max-w-56 text-center'>
                      Text unwiderruflich entfernt — bereit zur Veröffentlichung
                    </TooltipContent>
                  </Tooltip>
                </div>
              </>
            )}
            {!activeFile && error && (
              <div className='flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded shrink-0'>
                <AlertCircle className='h-3 w-3' /> {error}
                <button onClick={() => setError(null)}><X className='h-3 w-3' /></button>
              </div>
            )}
          </div>

          {activeFile ? (
            <div className='flex flex-col flex-1 min-h-0 overflow-hidden'>
              {/* Tabs strip */}
              <div className='shrink-0 flex items-center gap-0.5 px-2 pt-1.5 pb-1 flex-wrap min-w-0 bg-muted/50 border-b'>
                {files.map((f, i) => (
                  <button key={i} onClick={() => { setActiveFileIdx(i); setSelectedId(null) }}
                    className={`flex items-center gap-1.5 px-2.5 h-6 rounded text-xs whitespace-nowrap transition-colors shrink-0 ${i === activeFileIdx ? 'bg-muted shadow-sm border text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}>
                    <FileText className='h-3 w-3 shrink-0' />
                    <span className='max-w-[130px] truncate'>{f.name}</span>
                    <X className='h-2.5 w-2.5 shrink-0 opacity-50 hover:opacity-100 hover:text-destructive' onClick={e => { e.stopPropagation(); removeFile(i) }} />
                  </button>
                ))}
                <button onClick={() => fileInputRef.current?.click()}
                  className='flex items-center gap-1 px-2 h-6 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors shrink-0'>
                  <Upload className='h-3 w-3' /> Hochladen
                </button>
              </div>
              <PdfViewer file={activeFile} redactions={activeRedactions} selectedId={selectedId} zoom={zoom}
                onRedactionAdd={addRedaction} onRedactionRemove={() => {}} onRedactionUpdate={updateRedaction}
                onSelectionChange={setSelectedId} onZoomChange={setZoom} onExport={handleExport}
                onPageTextExtracted={handleTextExtracted} onPagesLoaded={setPages}
                pendingSuggestions={pendingSuggestions} pendingTextRanges={pendingTextRanges} pendingPageRanges={pendingPageRanges}
                onSuggestionsApplied={() => { setPendingSuggestions([]); setPendingTextRanges([]); setPendingPageRanges([]) }}
                exportRef={exportRef}
                onAccept={acceptRedaction} onIgnore={ignoreRedaction}
                foiRules={foiRules}
                redactionMode={session.redactionMode} />
            </div>
          ) : (
            <div
              className={`flex-1 flex flex-col items-center justify-center gap-4 m-4 rounded-2xl border-2 border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20'}`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}>
              <Upload className='h-10 w-10 text-muted-foreground/40' />
              <div className='text-center'>
                <p className='font-medium text-sm'>PDF oder DOCX hochladen</p>
                <p className='text-xs text-muted-foreground mt-1'>Drag & Drop oder klicken zum Auswählen</p>
              </div>
              <Button onClick={() => fileInputRef.current?.click()}>Datei auswählen</Button>
            </div>
          )}
        </div>

        {/* Right drag handle */}
        <div onMouseDown={startDrag('right')}
          className='w-px shrink-0 cursor-col-resize bg-border hover:bg-primary/50 active:bg-primary/70 transition-colors z-10' />

        {/* Right — Chat */}
        <div style={{ width: rightWidth }} className='shrink-0 flex flex-col min-w-0 border-l'>
          <ChatPanel consent={session.consent} redactionMode={session.redactionMode}
            documentNames={session.documents.map(d => d.name)}
            triggerRef={chatTriggerRef}
            onDeferredTrigger={msg => { pendingChatTrigger.current = `[System: ${msg}]` }}
            foiJurisdiction={session.foiJurisdiction}
            documentPages={documentPages}
            initialMessages={chatMessages}
            redactions={session.redactions}
            onSuggestionsReceived={(suggestions, textRanges, pageRanges, remove) => {
              remove.forEach(id => {
                if (session.redactions.find(r => r.id === id)?.status === 'suggested') removeRedaction(id)
              })
              setPendingSuggestions(suggestions)
              setPendingTextRanges(textRanges)
              setPendingPageRanges(pageRanges)
            }}
            onMessagesChange={msgs => { setChatMessages(msgs); saveChat(msgs) }}
            onConsentChange={mode => updateSession({ consent: mode })} />
        </div>
      </div>

      <input ref={fileInputRef} type='file' accept='.pdf,.docx,application/pdf' multiple className='hidden'
        onChange={e => e.target.files && handleFiles(e.target.files)} />
    </div>
  )
}
