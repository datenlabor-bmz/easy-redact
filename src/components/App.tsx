'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PdfViewer } from '@/components/pdf/PdfViewer'
import { LeftSidebar } from '@/components/sidebar/LeftSidebar'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { ConsentBar } from '@/components/ConsentBar'
import { ConsentModal } from '@/components/ConsentModal'
import { saveFile, loadFile, saveSession, loadSession, saveChat, loadChat, deleteFile } from '@/lib/storage'
import { generateUUID } from '@/components/pdf/geometry'
import type { Redaction, Session, PageData, ConsentMode, RedactionSuggestion, ChatMessage } from '@/types'

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [activeFileIdx, setActiveFileIdx] = useState(0)
  const [zoom, setZoom] = useState(100)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pages, setPages] = useState<PageData[]>([])
  const [documentPages, setDocumentPages] = useState<Array<{ pageIndex: number; text: string }>>([])
  const [consentModalOpen, setConsentModalOpen] = useState(false)
  const [consentReason, setConsentReason] = useState('')
  const [pendingSuggestions, setPendingSuggestions] = useState<RedactionSuggestion[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const updateSession = useCallback((updates: Partial<Session>) => {
    setSession(prev => {
      const next = { ...prev!, ...updates }
      saveSession(next)
      return next
    })
  }, [])

  const addRedaction = useCallback((r: Redaction) => {
    setSession(prev => {
      const next = { ...prev!, redactions: [...prev!.redactions, r] }
      saveSession(next)
      return next
    })
  }, [])

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

  const handleConsentRequired = useCallback((reason: string) => {
    setConsentReason(reason); setConsentModalOpen(true)
  }, [])

  const handleConsent = useCallback((mode: ConsentMode) => {
    updateSession({ consent: mode }); setConsentModalOpen(false)
  }, [updateSession])

  const handleExport = useCallback((blob: Blob, _applied: boolean) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `redacted-${files[activeFileIdx]?.name ?? 'document.pdf'}`
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

  return (
    <div className='flex flex-col h-screen bg-background overflow-hidden'>
      {/* Header */}
      <header className='shrink-0 flex items-center justify-between px-4 py-2.5 border-b bg-card shadow-sm'>
        <div className='flex items-center gap-2'>
          <div className='w-7 h-7 rounded-lg bg-primary flex items-center justify-center'>
            <span className='text-primary-foreground text-xs font-bold'>E</span>
          </div>
          <span className='font-semibold text-sm'>EasyRedact</span>
        </div>

        {files.length > 0 && (
          <div className='flex items-center gap-1 overflow-x-auto max-w-md'>
            {files.map((f, i) => (
              <button key={i} onClick={() => { setActiveFileIdx(i); setSelectedId(null) }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs whitespace-nowrap transition-colors ${i === activeFileIdx ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80 text-muted-foreground'}`}>
                <FileText className='h-3 w-3' />
                {f.name.length > 20 ? f.name.slice(0, 18) + '…' : f.name}
                <X className='h-2.5 w-2.5 hover:text-red-400' onClick={e => {
                  e.stopPropagation()
                  const next = files.filter((_, fi) => fi !== i)
                  setFiles(next); setActiveFileIdx(Math.min(activeFileIdx, next.length - 1))
                  if (session.documents[i]) {
                    deleteFile(session.documents[i].idbKey)
                    updateSession({ documents: session.documents.filter((_, di) => di !== i) })
                  }
                }} />
              </button>
            ))}
            <Button variant='ghost' size='sm' className='h-7 text-xs' onClick={() => fileInputRef.current?.click()}>
              + Datei
            </Button>
          </div>
        )}

        {error && (
          <div className='flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-1 rounded'>
            <AlertCircle className='h-3 w-3' /> {error}
            <button onClick={() => setError(null)} className='ml-1'><X className='h-3 w-3' /></button>
          </div>
        )}
      </header>

      {/* Three-panel layout */}
      <div ref={containerRef} className='flex flex-1 min-h-0 select-none'>
        {/* Left sidebar */}
        <div style={{ width: leftWidth }} className='shrink-0 flex flex-col min-w-0'>
          <LeftSidebar pages={pages} redactions={session.redactions} selectedId={selectedId}
            onSelectRedaction={setSelectedId} onAccept={acceptRedaction} onIgnore={ignoreRedaction}
            onNavigatePage={handleNavigatePage} />
        </div>

        {/* Left drag handle */}
        <div onMouseDown={startDrag('left')}
          className='w-1 shrink-0 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10' />

        {/* Center — PDF viewer or upload prompt */}
        <div className='flex-1 min-w-0 flex flex-col overflow-hidden'>
          {activeFile ? (
            <PdfViewer file={activeFile} redactions={session.redactions} selectedId={selectedId} zoom={zoom}
              onRedactionAdd={addRedaction} onRedactionRemove={() => {}} onRedactionUpdate={updateRedaction}
              onSelectionChange={setSelectedId} onZoomChange={setZoom} onExport={handleExport}
              onPageTextExtracted={handleTextExtracted} onPagesLoaded={setPages}
              pendingSuggestions={pendingSuggestions} onSuggestionsApplied={() => setPendingSuggestions([])} />
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
          className='w-1 shrink-0 cursor-col-resize hover:bg-primary/30 active:bg-primary/50 transition-colors z-10' />

        {/* Right — Chat */}
        <div style={{ width: rightWidth }} className='shrink-0 flex flex-col min-w-0 border-l'>
          <ConsentBar consent={session.consent} onConsentChange={mode => updateSession({ consent: mode })} />
          <div className='flex-1 min-h-0'>
            <ChatPanel consent={session.consent} redactionMode={session.redactionMode}
              foiJurisdiction={session.foiJurisdiction}
              documentPages={session.consent ? documentPages : undefined}
              initialMessages={chatMessages}
              onConsentRequired={handleConsentRequired}
              onSuggestionsReceived={setPendingSuggestions}
              onMessagesChange={msgs => { setChatMessages(msgs); saveChat(msgs) }} />
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type='file' accept='.pdf,.docx,application/pdf' multiple className='hidden'
        onChange={e => e.target.files && handleFiles(e.target.files)} />

      <ConsentModal open={consentModalOpen} reason={consentReason}
        onConsent={handleConsent} onClose={() => setConsentModalOpen(false)} />
    </div>
  )
}
