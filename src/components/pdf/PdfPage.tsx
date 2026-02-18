'use client'

import type { Redaction, HighlightInProgress, PageData } from '@/types'
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
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void
  onMouseUp: () => void
}

export function PdfPage({ pageIndex, pageData, zoom, redactions, selectedId, currentHighlight,
  onRedactionClick, onMouseDown, onMouseMove, onMouseUp }: PdfPageProps) {
  const [, , pw, ph] = pageData.bounds
  return (
    <div className='flex flex-col items-center'>
      <div data-page-index={pageIndex} style={{ width: `${(pw * zoom) / 100}px`, height: `${(ph * zoom) / 100}px` }}
        className='relative shadow-md rounded-sm mx-2 my-2'>
        <img src={pageData.image} className='w-full h-full' alt={`Page ${pageIndex + 1}`} />
        <RedactionOverlay pageIndex={pageIndex} pageWidth={pw} pageHeight={ph} pageData={pageData}
          redactions={redactions} selectedId={selectedId} currentHighlight={currentHighlight}
          onRedactionClick={onRedactionClick} onMouseDown={onMouseDown}
          onMouseMove={onMouseMove} onMouseUp={onMouseUp} />
      </div>
      <p className='text-xs text-muted-foreground mb-3'>Seite {pageIndex + 1}</p>
    </div>
  )
}
