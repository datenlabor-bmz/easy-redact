'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, LayoutGrid, List, Users } from 'lucide-react'
import type { Redaction, PageData } from '@/types'

interface LeftSidebarProps {
  pages: PageData[]
  redactions: Redaction[]
  selectedId: string | null
  onSelectRedaction: (id: string) => void
  onAccept: (id: string) => void
  onIgnore: (id: string) => void
  onNavigatePage: (idx: number) => void
}

// ── Thumbnails ─────────────────────────────────────────────────────────────────

function ThumbnailGrid({ pages, redactions, onNavigatePage }: {
  pages: PageData[]
  redactions: Redaction[]
  onNavigatePage: (idx: number) => void
}) {
  return (
    <div className='grid grid-cols-2 gap-2 p-2'>
      {pages.map((page, i) => {
        const count = redactions.filter(r => r.pageIndex === i && r.status !== 'ignored').length
        return (
          <button key={i} onClick={() => onNavigatePage(i)}
            className='relative rounded-sm overflow-hidden border hover:border-primary transition-colors'>
            <img src={page.image} alt={`Seite ${i + 1}`} className='w-full object-contain' />
            <div className='absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[10px] text-center py-0.5'>
              Seite {i + 1}
            </div>
            {count > 0 && (
              <Badge className='absolute top-1 right-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center rounded-full bg-primary'>
                {count}
              </Badge>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ── Redaction list item ────────────────────────────────────────────────────────

function RedactionItem({ r, selected, onSelect, onAccept, onIgnore }: {
  r: Redaction; selected: boolean
  onSelect: () => void; onAccept: () => void; onIgnore: () => void
}) {
  const statusColor = {
    manual: 'bg-foreground text-background',
    suggested: r.confidence === 'low' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    accepted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    ignored: 'bg-muted text-muted-foreground line-through',
  }[r.status]

  return (
    <div onClick={onSelect}
      className={`group flex items-start gap-2 px-3 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${selected ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}`}>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-1.5 mb-0.5'>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${statusColor}`}>
            S. {r.pageIndex + 1}
          </span>
          {r.confidence && (
            <span className={`text-[10px] px-1 py-0.5 rounded ${r.confidence === 'low' ? 'text-blue-600' : 'text-amber-600'}`}>
              {r.confidence === 'low' ? 'unsicher' : 'sicher'}
            </span>
          )}
        </div>
        {r.person && <p className='text-xs font-medium truncate'>{r.person}</p>}
        {r.reason && <p className='text-[11px] text-muted-foreground truncate'>{r.reason}</p>}
      </div>
      {r.status === 'suggested' && (
        <div className='flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0'>
          <Button variant='ghost' size='icon' className='h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50' onClick={e => { e.stopPropagation(); onAccept() }}>
            <Check className='h-3.5 w-3.5' />
          </Button>
          <Button variant='ghost' size='icon' className='h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50' onClick={e => { e.stopPropagation(); onIgnore() }}>
            <X className='h-3.5 w-3.5' />
          </Button>
        </div>
      )}
      {r.status === 'accepted' && <Check className='h-3.5 w-3.5 shrink-0 text-green-600 mt-1' />}
    </div>
  )
}

// ── Chronological list ────────────────────────────────────────────────────────

function ChronologicalList({ redactions, selectedId, onSelect, onAccept, onIgnore }: {
  redactions: Redaction[]; selectedId: string | null
  onSelect: (id: string) => void; onAccept: (id: string) => void; onIgnore: (id: string) => void
}) {
  const sorted = [...redactions].sort((a, b) => {
    if (a.pageIndex !== b.pageIndex) return a.pageIndex - b.pageIndex
    return (a.parts[0]?.y ?? 0) - (b.parts[0]?.y ?? 0)
  })

  if (!sorted.length) return <p className='text-xs text-muted-foreground p-4 text-center'>Keine Schwärzungen vorhanden</p>

  return (
    <div className='divide-y divide-border/50'>
      {sorted.map(r => (
        <RedactionItem key={r.id} r={r} selected={selectedId === r.id}
          onSelect={() => onSelect(r.id)} onAccept={() => onAccept(r.id)} onIgnore={() => onIgnore(r.id)} />
      ))}
    </div>
  )
}

// ── Grouped view ──────────────────────────────────────────────────────────────

function GroupedList({ redactions, selectedId, onSelect, onAccept, onIgnore }: {
  redactions: Redaction[]; selectedId: string | null
  onSelect: (id: string) => void; onAccept: (id: string) => void; onIgnore: (id: string) => void
}) {
  // Group by personGroup → person
  const groups = new Map<string, Map<string, Redaction[]>>()
  for (const r of redactions) {
    const group = r.personGroup ?? 'Sonstige'
    const person = r.person ?? '(unbekannt)'
    if (!groups.has(group)) groups.set(group, new Map())
    const persons = groups.get(group)!
    if (!persons.has(person)) persons.set(person, [])
    persons.get(person)!.push(r)
  }

  if (!groups.size) return <p className='text-xs text-muted-foreground p-4 text-center'>Keine Schwärzungen vorhanden</p>

  return (
    <div className='divide-y divide-border'>
      {[...groups.entries()].map(([group, persons]) => (
        <div key={group}>
          <div className='px-3 py-1.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between'>
            <span>{group}</span>
            <div className='flex gap-1'>
              <Button variant='ghost' size='icon' className='h-5 w-5 text-green-600'
                title='Alle akzeptieren'
                onClick={() => persons.forEach((rs) => rs.forEach(r => r.status === 'suggested' && onAccept(r.id)))}>
                <Check className='h-3 w-3' />
              </Button>
              <Button variant='ghost' size='icon' className='h-5 w-5 text-red-500'
                title='Alle ablehnen'
                onClick={() => persons.forEach((rs) => rs.forEach(r => r.status === 'suggested' && onIgnore(r.id)))}>
                <X className='h-3 w-3' />
              </Button>
            </div>
          </div>
          {[...persons.entries()].map(([person, rs]) => (
            <div key={person}>
              <div className='px-4 py-1 text-xs font-medium bg-muted/10 flex items-center justify-between'>
                <span>{person}</span>
                <span className='text-[10px] text-muted-foreground'>{rs.filter(r => r.status !== 'ignored').length} Schwärzungen</span>
              </div>
              {rs.map(r => (
                <RedactionItem key={r.id} r={r} selected={selectedId === r.id}
                  onSelect={() => onSelect(r.id)} onAccept={() => onAccept(r.id)} onIgnore={() => onIgnore(r.id)} />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export function LeftSidebar({ pages, redactions, selectedId, onSelectRedaction, onAccept, onIgnore, onNavigatePage }: LeftSidebarProps) {
  const visibleCount = redactions.filter(r => r.status !== 'ignored').length
  const suggestedCount = redactions.filter(r => r.status === 'suggested').length

  return (
    <div className='flex flex-col h-full border-r bg-card'>
      <div className='px-3 py-2 border-b'>
        <p className='text-xs font-semibold text-foreground'>Schwärzungen</p>
        <div className='flex gap-2 mt-0.5'>
          <span className='text-[10px] text-muted-foreground'>{visibleCount} gesamt</span>
          {suggestedCount > 0 && <span className='text-[10px] text-amber-600'>{suggestedCount} Vorschläge</span>}
        </div>
      </div>

      <Tabs defaultValue='list' className='flex-1 flex flex-col min-h-0'>
        <TabsList className='mx-2 mt-1.5 mb-1 h-7 grid grid-cols-3'>
          <TabsTrigger value='thumbnails' className='text-[11px] h-full'><LayoutGrid className='h-3 w-3' /></TabsTrigger>
          <TabsTrigger value='list' className='text-[11px] h-full'><List className='h-3 w-3' /></TabsTrigger>
          <TabsTrigger value='groups' className='text-[11px] h-full'><Users className='h-3 w-3' /></TabsTrigger>
        </TabsList>

        <TabsContent value='thumbnails' className='flex-1 mt-0 overflow-hidden'>
          <ScrollArea className='h-full'>
            {pages.length === 0
              ? <p className='text-xs text-muted-foreground p-4 text-center'>Kein Dokument geladen</p>
              : <ThumbnailGrid pages={pages} redactions={redactions} onNavigatePage={onNavigatePage} />}
          </ScrollArea>
        </TabsContent>

        <TabsContent value='list' className='flex-1 mt-0 overflow-hidden'>
          <ScrollArea className='h-full'>
            <ChronologicalList redactions={redactions} selectedId={selectedId}
              onSelect={onSelectRedaction} onAccept={onAccept} onIgnore={onIgnore} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value='groups' className='flex-1 mt-0 overflow-hidden'>
          <ScrollArea className='h-full'>
            <GroupedList redactions={redactions} selectedId={selectedId}
              onSelect={onSelectRedaction} onAccept={onAccept} onIgnore={onIgnore} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
