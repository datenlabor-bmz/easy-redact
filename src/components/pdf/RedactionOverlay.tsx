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
  const isSuggested = redaction.status === 'suggested'
  const btnSize = 18
  const btnGap = 3
  // anchor to the last part (bottom of text flow) — always an actual highlighted rect
  const last = redaction.parts.reduce((a, b) => (b.y + b.height > a.y + a.height ? b : a))
  const btnY = last.y + (last.height - btnSize) / 2
  const ignoreX = last.x + last.width - btnSize - btnGap
  const acceptX = ignoreX - (isSuggested ? btnSize + btnGap : 0)

  return (
    <g>
      {isSuggested && (
        <>
          <rect x={acceptX} y={btnY} width={btnSize} height={btnSize} rx={btnSize / 2}
            fill='#16a34a' fillOpacity={1} stroke='none' filter='url(#btn-shadow)'
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onAccept?.(redaction.id) }}
            style={{ cursor: 'pointer' }} />
          <text x={acceptX + btnSize / 2} y={btnY + btnSize * 0.72}
            textAnchor='middle' fontSize={btnSize * 0.6} fill='white' fontWeight='bold'
            onMouseDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onAccept?.(redaction.id) }}
            style={{ cursor: 'pointer', userSelect: 'none' }}>✓</text>
        </>
      )}
      <rect x={ignoreX} y={btnY} width={btnSize} height={btnSize} rx={btnSize / 2}
        fill='#dc2626' fillOpacity={1} stroke='none' filter='url(#btn-shadow)'
        onMouseDown={e => e.stopPropagation()}
        onClick={e => { e.stopPropagation(); onIgnore?.(redaction.id) }}
        style={{ cursor: 'pointer' }} />
      <text x={ignoreX + btnSize / 2} y={btnY + btnSize * 0.72}
        textAnchor='middle' fontSize={btnSize * 0.6} fill='white'
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
      <defs>
        <filter id='btn-shadow' x='-30%' y='-30%' width='160%' height='160%'>
          <feDropShadow dx='0' dy='0' stdDeviation='2.5' floodColor='white' floodOpacity='0.85' />
        </filter>
      </defs>

      {/* Search highlights */}
      {searchMatches?.map((parts, i) => parts.map((p, j) => (
        <rect key={`s-${i}-${j}`} x={p.x} y={p.y} width={p.width} height={p.height}
          fill={i === searchCurrentMatch ? '#2563eb' : '#60a5fa'}
          fillOpacity={i === searchCurrentMatch ? 0.55 : 0.3}
          stroke={i === searchCurrentMatch ? '#2563eb' : 'none'}
          strokeWidth={i === searchCurrentMatch ? 1.5 : 0}
          pointerEvents='none' />
      )))}

      {/* Highlight boxes + inline action buttons */}
      {pageRedactions.map(r => (
        <g key={r.id} onClick={(e) => onRedactionClick(r.id, e)} data-highlight='true'
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setLastHoveredId(r.id)}
          onMouseLeave={() => setLastHoveredId(null)}>
          {/* transparent hit area covering full bounding box */}
          {(() => { const bb = boundingBox(r); return <rect x={bb.x0} y={bb.y0} width={bb.x1 - bb.x0} height={bb.y1 - bb.y0} fill='transparent' stroke='none' /> })()}
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
          {(r.id === lastHoveredId || selectedId === r.id) && (
            <RedactionButtons redaction={r} onAccept={onAccept} onIgnore={onIgnore} />
          )}
        </g>
      ))}
      {renderCurrent()}
    </svg>
  )
}
