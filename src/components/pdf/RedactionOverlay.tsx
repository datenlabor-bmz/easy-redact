'use client'

import type { Redaction, RedactionPart, HighlightInProgress, PageData } from '@/types'
import { finalizeHighlight, boundingBox } from './geometry'

function RedactionBox({ part, status, confidence }: {
  part: RedactionPart
  status: string
  confidence?: string
}) {
  if (status === 'ignored') return null

  const isManualOrAccepted = status === 'manual' || status === 'accepted'
  const isSuggested = status === 'suggested'

  let fill: string, fillOpacity: number, stroke: string, strokeDasharray: string
  if (isManualOrAccepted) {
    fill = 'black'; fillOpacity = 0.85; stroke = 'black'; strokeDasharray = 'none'
  } else if (isSuggested && confidence === 'low') {
    fill = '#3b82f6'; fillOpacity = 0.15; stroke = '#3b82f6'; strokeDasharray = '4,3'
  } else {
    fill = '#f59e0b'; fillOpacity = 0.15; stroke = '#f59e0b'; strokeDasharray = '4,3'
  }

  return (
    <rect x={part.x} y={part.y} width={part.width} height={part.height}
      fill={fill} fillOpacity={fillOpacity} stroke={stroke} strokeOpacity={1}
      strokeWidth={1.5} strokeDasharray={strokeDasharray} style={{ cursor: 'pointer' }} />
  )
}

function RedactionGroup({ redaction, isSelected, onClick }: {
  redaction: Redaction
  isSelected: boolean
  onClick: (id: string, e: React.MouseEvent) => void
}) {
  if (redaction.status === 'ignored') return null
  const bbox = boundingBox(redaction)
  return (
    <g onClick={(e) => onClick(redaction.id, e)} data-highlight='true' style={{ cursor: 'pointer' }}>
      {redaction.parts.map((part, i) => (
        <RedactionBox key={i} part={part} status={redaction.status} confidence={redaction.confidence} />
      ))}
      {isSelected && (
        <rect x={bbox.x0 - 2} y={bbox.y0 - 2} width={bbox.x1 - bbox.x0 + 4} height={bbox.y1 - bbox.y0 + 4}
          fill='none' stroke='#6366f1' strokeWidth={2} strokeDasharray='4,4' pointerEvents='none' />
      )}
    </g>
  )
}

export interface RedactionOverlayProps {
  pageIndex: number
  pageWidth: number; pageHeight: number
  pageData: PageData
  redactions: Redaction[]
  selectedId: string | null
  currentHighlight: HighlightInProgress | null
  onRedactionClick: (id: string, e: React.MouseEvent) => void
  onMouseDown: (e: React.MouseEvent<SVGSVGElement>, pageIndex: number) => void
  onMouseMove: (e: React.MouseEvent<SVGSVGElement>) => void
  onMouseUp: () => void
}

export function RedactionOverlay({
  pageIndex, pageWidth, pageHeight, pageData, redactions, selectedId,
  currentHighlight, onRedactionClick, onMouseDown, onMouseMove, onMouseUp,
}: RedactionOverlayProps) {
  const pageRedactions = redactions.filter(r => r.pageIndex === pageIndex)

  const renderCurrent = () => {
    if (!currentHighlight || currentHighlight.pageIndex !== pageIndex) return null
    const tmp = finalizeHighlight(pageData, currentHighlight)
    return <g>{tmp.parts.map((p, i) => <RedactionBox key={i} part={p} status='manual' />)}</g>
  }

  return (
    <svg width='100%' height='100%' viewBox={`0 0 ${pageWidth} ${pageHeight}`}
      style={{ position: 'absolute', top: 0, left: 0, cursor: 'crosshair' }}
      onMouseDown={(e) => onMouseDown(e, pageIndex)}
      onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
      {pageRedactions.map(r => (
        <RedactionGroup key={r.id} redaction={r} isSelected={selectedId === r.id} onClick={onRedactionClick} />
      ))}
      {renderCurrent()}
    </svg>
  )
}
