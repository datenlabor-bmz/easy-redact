'use client'

import type { Redaction, HighlightInProgress, PageData, RedactionPart } from '@/types'
import { RedactionOverlay } from './RedactionOverlay'

export interface PdfPageProps {
  pageIndex: number
  pageData: PageData
  zoom: number
  redactions: Redaction[]
  selectedId: string | null
  currentHighlight: HighlightInProgress | null
  onRedactionClick: (id: string, e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>, pageIndex: number) => void
  onAccept?: (id: string) => void
  onIgnore?: (id: string) => void
  searchMatches?: RedactionPart[][]
  searchCurrentMatch?: number
  selectMode?: 'text' | 'freehand'
}

export function PdfPage({ pageIndex, pageData, zoom, redactions, selectedId, currentHighlight,
  onRedactionClick, onMouseDown, onAccept, onIgnore, searchMatches, searchCurrentMatch, selectMode }: PdfPageProps) {
  const [, , pw, ph] = pageData.bounds
  return (
    <div className='flex flex-col items-center'>
      <div data-page-index={pageIndex} style={{ width: `${(pw * zoom) / 100}px`, height: `${(ph * zoom) / 100}px` }}
        className='relative shadow-lg rounded-sm mx-2 my-3'>
        <img src={pageData.image} className='w-full h-full' alt={`Page ${pageIndex + 1}`} />
        <RedactionOverlay pageIndex={pageIndex} pageWidth={pw} pageHeight={ph} pageData={pageData}
          redactions={redactions} selectedId={selectedId} currentHighlight={currentHighlight}
          onRedactionClick={onRedactionClick} onMouseDown={onMouseDown}
          onAccept={onAccept} onIgnore={onIgnore}
          searchMatches={searchMatches} searchCurrentMatch={searchCurrentMatch}
          selectMode={selectMode} />
      </div>
      <p className='text-xs text-muted-foreground mb-3'>Seite {pageIndex + 1}</p>
    </div>
  )
}
