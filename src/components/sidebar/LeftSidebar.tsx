'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Check, X, LayoutGrid, List, Users, BoxSelect, Trash2 } from 'lucide-react'
import type { Redaction, PageData } from '@/types'
import { getRedactionText } from '@/components/pdf/geometry'

interface LeftSidebarProps {
  pages: PageData[]
  redactions: Redaction[]
  selectedId: string | null
  onSelectRedaction: (id: string) => void
  onAccept: (id: string) => void
  onIgnore: (id: string) => void
  onNavigatePage: (idx: number) => void
  onClearAll?: () => void
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

function RedactionItem({ r, page, selected, onSelect, onAccept, onIgnore, variant = 'list' }: {
  r: Redaction; page: PageData | undefined; selected: boolean
  onSelect: () => void; onAccept: () => void; onIgnore: () => void
  variant?: 'list' | 'grouped'
}) {
  if (r.status === 'ignored') return null

  const isSuggested = r.status === 'suggested'
  const isLow = r.confidence === 'low'

  const borderCls = variant === 'grouped'
    ? selected ? 'bg-primary/5' : ''
    : selected
      ? 'border-l-2 border-primary bg-primary/5'
      : isSuggested
        ? 'border-l-2 border-yellow-400'
        : 'border-l-2 border-foreground/40'

  const highlightStyle: React.CSSProperties = isSuggested
    ? { background: isLow ? 'rgba(253,224,71,0.25)' : 'rgba(253,224,71,0.5)', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }
    : { background: 'rgba(0,0,0,0.45)', boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }

  const text = page ? getRedactionText(r, page) : ''

  return (
    <div onClick={onSelect}
      className={`group flex items-center gap-2 py-2 cursor-pointer transition-colors hover:bg-muted/50 ${variant === 'grouped' ? 'pl-3 pr-2' : 'px-3'} ${borderCls}`}>
      <div className='flex-1 min-w-0'>
        {text ? (
          <p className={`text-xs font-mono leading-relaxed break-words whitespace-pre-wrap ${isSuggested && isLow ? 'text-muted-foreground' : ''}`}>
            <span style={{ ...highlightStyle, padding: '1px 3px' }}>{text}</span>
          </p>
        ) : (
          <div className='flex items-center gap-1.5 text-[11px] text-muted-foreground italic'>
            <BoxSelect className='h-3 w-3 shrink-0' />
            <span style={{ ...highlightStyle, padding: '1px 3px' }}>Freihand-Schwärzung</span>
          </div>
        )}
      </div>
      <div className={`flex gap-1 shrink-0 ${variant === 'grouped' ? 'opacity-0 group-hover:opacity-100 transition-opacity' : ''}`}>
        {isSuggested && (
          <Button variant='ghost' size='icon' className='h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50' onClick={e => { e.stopPropagation(); onAccept() }}>
            <Check className='h-3.5 w-3.5' />
          </Button>
        )}
        <Button variant='ghost' size='icon'
          className='h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50'
          onClick={e => { e.stopPropagation(); onIgnore() }}>
          <X className='h-3.5 w-3.5' />
        </Button>
      </div>
    </div>
  )
}

// ── Chronological list ────────────────────────────────────────────────────────

function ChronologicalList({ redactions, pages, selectedId, onSelect, onAccept, onIgnore }: {
  redactions: Redaction[]; pages: PageData[]; selectedId: string | null
  onSelect: (id: string) => void; onAccept: (id: string) => void; onIgnore: (id: string) => void
}) {
  const sorted = [...redactions].sort((a, b) =>
    a.pageIndex !== b.pageIndex ? a.pageIndex - b.pageIndex : (a.parts[0]?.y ?? 0) - (b.parts[0]?.y ?? 0)
  )

  if (!sorted.length) return <p className='text-xs text-muted-foreground p-4 text-center'>Keine Schwärzungen vorhanden</p>

  const byPage = sorted.reduce<Map<number, Redaction[]>>((acc, r) => {
    acc.set(r.pageIndex, [...(acc.get(r.pageIndex) ?? []), r])
    return acc
  }, new Map())

  return (
    <div>
      {[...byPage.entries()].map(([pageIdx, rs]) => (
        <div key={pageIdx}>
          <div className='px-3 py-1.5 bg-muted/30 text-[11px] font-semibold text-muted-foreground sticky top-0'>
            Seite {pageIdx + 1}
          </div>
          <div>
            {rs.map(r => (
              <RedactionItem key={r.id} r={r} page={pages[r.pageIndex]} selected={selectedId === r.id}
                onSelect={() => onSelect(r.id)} onAccept={() => onAccept(r.id)} onIgnore={() => onIgnore(r.id)} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Grouped view ──────────────────────────────────────────────────────────────

function GroupedList({ redactions, pages, selectedId, onSelect, onAccept, onIgnore }: {
  redactions: Redaction[]; pages: PageData[]; selectedId: string | null
  onSelect: (id: string) => void; onAccept: (id: string) => void; onIgnore: (id: string) => void
}) {
  // Group by personGroup → person
  const groups = new Map<string, Map<string, Redaction[]>>()
  for (const r of redactions) {
    const raw = r.personGroup ?? 'Sonstige'
    const group = raw.toLowerCase() === 'sonstiges' ? 'Sonstige' : raw
    const person = r.person || r.text || '(unbekannt)'
    if (!groups.has(group)) groups.set(group, new Map())
    const persons = groups.get(group)!
    if (!persons.has(person)) persons.set(person, [])
    persons.get(person)!.push(r)
  }

  if (!groups.size) return <p className='text-xs text-muted-foreground p-4 text-center'>Keine Schwärzungen vorhanden</p>

  return (
    <div>
      {[...groups.entries()].map(([group, persons]) => (
        <div key={group}>
          <div className='group/cat pl-3 pr-5 py-1.5 bg-muted/30 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between'>
            <span>{group}</span>
            <div className='flex gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity'>
              <Button variant='ghost' size='icon' className='h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50'
                title='Alle akzeptieren'
                onClick={() => persons.forEach((rs) => rs.forEach(r => r.status === 'suggested' && onAccept(r.id)))}>
                <Check className='h-3.5 w-3.5' />
              </Button>
              <Button variant='ghost' size='icon' className='h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50'
                title='Alle ablehnen'
                onClick={() => persons.forEach((rs) => rs.forEach(r => r.status === 'suggested' && onIgnore(r.id)))}>
                <X className='h-3.5 w-3.5' />
              </Button>
            </div>
          </div>
          {[...persons.entries()].map(([person, rs]) => {
            const visible = rs.filter(r => r.status !== 'ignored')
            if (!visible.length) return null
            return (<div key={person} className='mx-3 mt-3 mb-1 rounded-lg ring-1 ring-border'>
              {/* Person header inside the box */}
              <div className='flex items-center pl-3 pr-2 py-1.5 gap-2 border-b border-border/50'>
                <span className='flex-1 text-[11px] font-medium text-foreground'>{person}</span>
                <div className='flex gap-1 shrink-0'>
                  {visible.some(r => r.status === 'suggested') && (
                    <Button variant='ghost' size='icon' className='h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50'
                      onClick={() => visible.forEach(r => r.status === 'suggested' && onAccept(r.id))}>
                      <Check className='h-3.5 w-3.5' />
                    </Button>
                  )}
                  <Button variant='ghost' size='icon' className='h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50'
                    onClick={() => visible.forEach(r => onIgnore(r.id))}>
                    <X className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </div>
              {rs.map(r => (
                <RedactionItem key={r.id} r={r} page={pages[r.pageIndex]} selected={selectedId === r.id}
                  onSelect={() => onSelect(r.id)} onAccept={() => onAccept(r.id)} onIgnore={() => onIgnore(r.id)}
                  variant='grouped' />
              ))}
            </div>
          )})}
        </div>
      ))}
    </div>
  )
}

// ── Main sidebar ──────────────────────────────────────────────────────────────

export function LeftSidebar({ pages, redactions, selectedId, onSelectRedaction, onAccept, onIgnore, onNavigatePage, onClearAll }: LeftSidebarProps) {
  const visibleCount = redactions.filter(r => r.status !== 'ignored').length
  const suggestedCount = redactions.filter(r => r.status === 'suggested').length

  return (
    <div className='flex flex-col h-full border-r bg-card'>
      <Tabs defaultValue='list' className='flex-1 flex flex-col min-h-0'>
        {/* Header: title | tabs (truly centered) | counters + delete */}
        <div className='h-11 px-2 border-b bg-muted/50 shrink-0 grid grid-cols-[1fr_auto_1fr] items-center'>
          {/* Left: title */}
          <span className='text-xs font-medium text-foreground'>Schwärzungen</span>

          {/* Center: tabs */}
          <TabsList className='h-7 p-0.5 gap-0'>
            {([
              { value: 'thumbnails', icon: LayoutGrid, label: 'Seitenvorschau' },
              { value: 'list',       icon: List,        label: 'Chronologische Liste' },
              { value: 'groups',     icon: Users,       label: 'Nach Person gruppiert' },
            ] as const).map(({ value, icon: Icon, label }) => (
              <Tooltip key={value}>
                <TooltipTrigger asChild><span className='inline-flex h-full aspect-square'>
                  <TabsTrigger value={value} className='h-full w-full px-0'><Icon className='h-3 w-3' /></TabsTrigger>
                </span></TooltipTrigger>
                <TooltipContent side='bottom'>{label}</TooltipContent>
              </Tooltip>
            ))}
          </TabsList>

          {/* Right: counters + delete */}
          <div className='flex items-center justify-end gap-1.5'>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className='text-[10px] text-muted-foreground tabular-nums cursor-default'>{visibleCount} Vorschläge</span>
              </TooltipTrigger>
              <TooltipContent side='bottom'>Schwärzungen gesamt (ohne ignorierte)</TooltipContent>
            </Tooltip>
            {suggestedCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className='text-[10px] text-amber-600 tabular-nums cursor-default'>{suggestedCount} offen</span>
                </TooltipTrigger>
                <TooltipContent side='bottom'>KI-Vorschläge noch nicht bestätigt</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant='ghost' size='icon' className='h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive'
                  onClick={onClearAll} disabled={redactions.length === 0}>
                  <Trash2 className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent side='bottom'>Alle Schwärzungen löschen</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <TabsContent value='thumbnails' className='flex-1 mt-0 overflow-hidden'>
          <ScrollArea className='h-full'>
            {pages.length === 0
              ? <p className='text-xs text-muted-foreground p-4 text-center'>Kein Dokument geladen</p>
              : <ThumbnailGrid pages={pages} redactions={redactions} onNavigatePage={onNavigatePage} />}
          </ScrollArea>
        </TabsContent>

        <TabsContent value='list' className='flex-1 mt-0 overflow-hidden'>
          <ScrollArea className='h-full'>
            <ChronologicalList redactions={redactions} pages={pages} selectedId={selectedId}
              onSelect={onSelectRedaction} onAccept={onAccept} onIgnore={onIgnore} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value='groups' className='flex-1 mt-0 overflow-hidden'>
          <ScrollArea className='h-full'>
            <GroupedList redactions={redactions} pages={pages} selectedId={selectedId}
              onSelect={onSelectRedaction} onAccept={onAccept} onIgnore={onIgnore} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
