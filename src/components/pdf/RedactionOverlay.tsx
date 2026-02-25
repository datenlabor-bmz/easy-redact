'use client'

import { useState } from 'react'
import type { Redaction, RedactionPart, HighlightInProgress, PageData } from '@/types'
import { finalizeHighlight, boundingBox } from './geometry'

export const ACCEPTED_OPACITY = 0.45
export const SUGGESTION_HIGH_OPACITY = 0.5
export const SUGGESTION_LOW_OPACITY = 0.25

function RedactionBox({ part, status, confidence }: {
  part: RedactionPart; status: string; confidence?: string
}) {
  if (status === 'ignored') return null
  let fill: string, fillOpacity: number
  if (status === 'manual' || status === 'accepted') {
    fill = 'black'; fillOpacity = ACCEPTED_OPACITY
  } else if (status === 'suggested') {
    fill = '#fde047'
    fillOpacity = confidence === 'low' ? SUGGESTION_LOW_OPACITY : SUGGESTION_HIGH_OPACITY
  } else {
    return null
  }
  return (
    <rect x={part.x} y={part.y} width={part.width} height={part.height}
      fill={fill} fillOpacity={fillOpacity} stroke='none' style={{ cursor: 'pointer' }} />
  )
}

function RedactionButtons({ redaction, onAccept, onIgnore }: {
  redaction: Redaction
  onAccept?: (id: string) => void
  onIgnore?: (id: string) => void
}) {
  const bbox = boundingBox(redaction)
  const isSuggested = redaction.status === 'suggested'
  const btnSize = 12
  const btnGap = 2
  const btnY = bbox.y0
  const acceptX = bbox.x1 + btnGap
  const ignoreX = acceptX + (isSuggested ? btnSize + btnGap : 0)

  return (
    <g>
      {isSuggested && (
        <>
          <rect x={acceptX} y={btnY} width={btnSize} height={btnSize} rx={2}
            fill='#16a34a' fillOpacity={1} stroke='none'
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onAccept?.(redaction.id) }}
            style={{ cursor: 'pointer' }} />
          <text x={acceptX + btnSize / 2} y={btnY + btnSize * 0.72}
            textAnchor='middle' fontSize={btnSize * 0.65} fill='white' fontWeight='bold'
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onAccept?.(redaction.id) }}
            style={{ cursor: 'pointer', userSelect: 'none' }}>✓</text>
        </>
      )}
      <rect x={ignoreX} y={btnY} width={btnSize} height={btnSize} rx={2}
        fill='#dc2626' fillOpacity={1} stroke='none'
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onIgnore?.(redaction.id) }}
        style={{ cursor: 'pointer' }} />
      <text x={ignoreX + btnSize / 2} y={btnY + btnSize * 0.72}
        textAnchor='middle' fontSize={btnSize * 0.65} fill='white'
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onIgnore?.(redaction.id) }}
        style={{ cursor: 'pointer', userSelect: 'none' }}>✕</text>
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
  onAccept?: (id: string) => void
  onIgnore?: (id: string) => void
  searchMatches?: RedactionPart[][]
  searchCurrentMatch?: number
  selectMode?: 'text' | 'freehand'
}

export function RedactionOverlay({
  pageIndex, pageWidth, pageHeight, pageData, redactions, selectedId,
  currentHighlight, onRedactionClick, onMouseDown, onAccept, onIgnore,
  searchMatches, searchCurrentMatch, selectMode,
}: RedactionOverlayProps) {
  const [lastHoveredId, setLastHoveredId] = useState<string | null>(null)
  const pageRedactions = redactions.filter(r => r.pageIndex === pageIndex && r.status !== 'ignored')

  const renderCurrent = () => {
    if (!currentHighlight || currentHighlight.pageIndex !== pageIndex) return null
    const tmp = finalizeHighlight(pageData, currentHighlight)
    return <g>{tmp.parts.map((p, i) => <RedactionBox key={i} part={p} status='manual' />)}</g>
  }

  return (
    <svg width='100%' height='100%' viewBox={`0 0 ${pageWidth} ${pageHeight}`}
      style={{ position: 'absolute', top: 0, left: 0, cursor: selectMode === 'text' ? 'text' : 'crosshair' }}
      onMouseDown={(e) => onMouseDown(e, pageIndex)}>

      {/* Search highlights */}
      {searchMatches?.map((parts, i) => parts.map((p, j) => (
        <rect key={`s-${i}-${j}`} x={p.x} y={p.y} width={p.width} height={p.height}
          fill={i === searchCurrentMatch ? '#2563eb' : '#60a5fa'}
          fillOpacity={i === searchCurrentMatch ? 0.55 : 0.3}
          stroke={i === searchCurrentMatch ? '#2563eb' : 'none'}
          strokeWidth={i === searchCurrentMatch ? 1.5 : 0}
          pointerEvents='none' />
      )))}

      {/* Pass 1: all highlight boxes */}
      {pageRedactions.map(r => (
        <g key={r.id} onClick={(e) => onRedactionClick(r.id, e)} data-highlight='true'
          style={{ cursor: 'pointer' }} onMouseEnter={() => setLastHoveredId(r.id)}>
          {r.parts.map((part, i) => (
            <RedactionBox key={i} part={part} status={r.status} confidence={r.confidence} />
          ))}
          {selectedId === r.id && (() => {
            const bbox = boundingBox(r)
            return (
              <rect x={bbox.x0 - 1} y={bbox.y0 - 1} width={bbox.x1 - bbox.x0 + 2} height={bbox.y1 - bbox.y0 + 2}
                fill='none' stroke='#6366f1' strokeWidth={1.5} pointerEvents='none' />
            )
          })()}
        </g>
      ))}
      {renderCurrent()}

      {/* Pass 2: action buttons on top of everything */}
      {pageRedactions.map(r =>
        (r.id === lastHoveredId || selectedId === r.id) ? (
          <RedactionButtons key={r.id} redaction={r} onAccept={onAccept} onIgnore={onIgnore} />
        ) : null
      )}
    </svg>
  )
}
