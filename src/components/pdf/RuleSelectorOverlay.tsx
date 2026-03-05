'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
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

  const reposition = useCallback(() => {
    const container = containerRef.current
    const panel = ref.current
    if (!container || !panel) return

    const pageEl = container.querySelector(`[data-page-index="${pageIndex}"]`) as HTMLElement | null
    if (!pageEl) return

    const bbox = boundingBox(redaction)
    const pageRect = pageEl.getBoundingClientRect()

    const bboxLeft = pageRect.left + (bbox.x0 / pageWidth) * pageRect.width
    const bboxRight = pageRect.left + (bbox.x1 / pageWidth) * pageRect.width
    const bboxTop = pageRect.top + (bbox.y0 / pageHeight) * pageRect.height

    const GAP = 8
    const panelW = panel.offsetWidth || 240
    const panelH = panel.offsetHeight || 300

    let left = bboxRight + GAP
    if (left + panelW > window.innerWidth - GAP) left = bboxLeft - panelW - GAP
    let top = bboxTop
    if (top + panelH > window.innerHeight - GAP) top = window.innerHeight - panelH - GAP
    if (top < GAP) top = GAP

    setPos({ left, top })
  }, [redaction, pageIndex, pageWidth, pageHeight, containerRef])

  useEffect(() => { reposition() }, [reposition])

  // Reposition on scroll so the overlay tracks the redaction
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', reposition, { passive: true })
    return () => container.removeEventListener('scroll', reposition)
  }, [containerRef, reposition])

  return (
    <div ref={ref}
      style={pos
        ? { position: 'fixed', left: pos.left, top: pos.top, zIndex: 9999 }
        : { position: 'fixed', left: -9999, top: -9999, zIndex: 9999 }}
      onMouseDown={e => e.stopPropagation()}>
      <RuleSelector
        rules={foiRules}
        selectedRule={redaction.rule}
        onRuleSelect={rule => { onRuleSelect(rule); onClose() }}
      />
    </div>
  )
}
