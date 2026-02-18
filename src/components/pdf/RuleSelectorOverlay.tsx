'use client'

import { useEffect, useRef, useState } from 'react'
import { RuleSelector } from '@/components/RuleSelector'
import { boundingBox } from './geometry'
import type { Redaction, RedactionRule } from '@/types'

interface Props {
  redaction: Redaction
  pageIndex: number
  pageWidth: number
  pageHeight: number
  zoom: number
  foiRules: RedactionRule[]
  containerRef: React.RefObject<HTMLDivElement>
  onRuleSelect: (rule?: RedactionRule) => void
  onClose: () => void
}

export function RuleSelectorOverlay({
  redaction, pageIndex, pageWidth, pageHeight, zoom, foiRules,
  containerRef, onRuleSelect, onClose,
}: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  // Compute position after mount so we can measure the panel and detect overflow
  useEffect(() => {
    const container = containerRef.current
    const panel = ref.current
    if (!container || !panel) return

    const pageEl = container.querySelector(`[data-page-index="${pageIndex}"]`) as HTMLElement | null
    if (!pageEl) return

    const bbox = boundingBox(redaction)
    const containerRect = container.getBoundingClientRect()
    const pageRect = pageEl.getBoundingClientRect()

    // bbox centre in scroll-relative coords
    const bboxLeftPx = pageRect.left - containerRect.left + container.scrollLeft +
      (bbox.x0 / pageWidth) * pageRect.width
    const bboxRightPx = pageRect.left - containerRect.left + container.scrollLeft +
      (bbox.x1 / pageWidth) * pageRect.width
    const bboxTopPx = pageRect.top - containerRect.top + container.scrollTop +
      (bbox.y0 / pageHeight) * pageRect.height

    const GAP = 8
    const panelW = panel.offsetWidth || 240
    const panelH = panel.offsetHeight || 300

    // Prefer right of bbox; flip left if it would overflow container
    let left = bboxRightPx + GAP
    if (left + panelW > container.scrollLeft + container.clientWidth - GAP) {
      left = bboxLeftPx - panelW - GAP
    }
    // Prefer top aligned to bbox; clamp so it stays within container scroll area
    let top = bboxTopPx
    const maxTop = container.scrollTop + container.clientHeight - panelH - GAP
    if (top > maxTop) top = maxTop
    if (top < container.scrollTop + GAP) top = container.scrollTop + GAP

    setPos({ left, top })
  }, [redaction, pageIndex, pageWidth, pageHeight, containerRef])

  return (
    <div ref={ref}
      style={pos
        ? { position: 'absolute', left: pos.left, top: pos.top, zIndex: 50 }
        // render offscreen initially so we can measure
        : { position: 'absolute', left: -9999, top: -9999, zIndex: 50 }}
      onMouseDown={e => e.stopPropagation()}>
      <RuleSelector
        rules={foiRules}
        selectedRule={redaction.rule}
        onRuleSelect={rule => { onRuleSelect(rule); onClose() }}
      />
    </div>
  )
}
