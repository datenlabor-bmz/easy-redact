'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, Check, AlertCircle, FileSearch, Brain, Lightbulb } from 'lucide-react'
import type { ToolCall } from './useChatStream'

const TOOL_ICONS: Record<string, React.ElementType> = {
  read_documents: FileSearch,
  suggest_redactions: Lightbulb,
  start_nlp_processing: Brain,
}

const TOOL_LABELS: Record<string, string> = {
  read_documents: 'Dokumente gelesen',
  suggest_redactions: '',  // handled inline
  start_nlp_processing: 'NLP-Verarbeitung',
}

const NO_EXPAND = new Set(['ask_user', 'request_document_access', 'read_documents', 'suggest_redactions'])

export function ChatToolCall({ toolCall }: { toolCall: ToolCall }) {
  const [expanded, setExpanded] = useState(false)

  if (toolCall.name === 'ask_user') return null
  if (toolCall.name === 'request_document_access') return null
  const Icon = TOOL_ICONS[toolCall.name] ?? Brain
  const canExpand = !NO_EXPAND.has(toolCall.name) && toolCall.result !== undefined

  // suggest_redactions: show added + removed counts
  if (toolCall.name === 'suggest_redactions') {
    const args = toolCall.args as any
    const added = (Array.isArray(args?.suggestions) ? args.suggestions.length : 0)
      + (Array.isArray(args?.textRanges) ? args.textRanges.length : 0)
      + (Array.isArray(args?.pageRanges) ? args.pageRanges.length : 0)
    const removed = Array.isArray(args?.remove) ? args.remove.length : 0
    const label = (() => {
      if (toolCall.status === 'running') return 'Schwärzungen werden bearbeitet…'
      if (toolCall.status === 'error') return 'Fehler beim Vorschlagen'
      const parts: string[] = []
      if (added > 0) parts.push(`${added} vorgeschlagen`)
      if (removed > 0) parts.push(`${removed} entfernt`)
      return parts.length ? parts.join(', ') : 'Schwärzungen vorgeschlagen'
    })()
    return (
      <div className='flex items-center gap-1.5 text-xs text-muted-foreground py-0.5'>
        {toolCall.status === 'running'
          ? <Loader2 className='h-3 w-3 animate-spin' />
          : toolCall.status === 'error'
            ? <AlertCircle className='h-3 w-3 text-destructive' />
            : <Check className='h-3 w-3' />}
        {label}
      </div>
    )
  }

  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name

  return (
    <div className='flex items-center gap-1.5 text-xs text-muted-foreground py-0.5'>
      {toolCall.status === 'running'
        ? <Loader2 className='h-3 w-3 animate-spin' />
        : toolCall.status === 'error'
          ? <AlertCircle className='h-3 w-3 text-destructive' />
          : <Check className='h-3 w-3' />}
      {toolCall.name !== 'read_documents' && <Icon className='h-3 w-3' />}
      <span className={toolCall.status === 'error' ? 'text-destructive' : ''}>
        {toolCall.status === 'running' ? `${label}…` : label}
      </span>
      {canExpand && (
        <button onClick={() => setExpanded(!expanded)} className='ml-0.5 hover:text-foreground transition-colors'>
          {expanded ? <ChevronDown className='h-3 w-3' /> : <ChevronRight className='h-3 w-3' />}
        </button>
      )}
      {expanded && toolCall.result !== undefined && (
        <pre className='mt-1 bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground text-[10px] w-full'>
          {JSON.stringify(toolCall.result, null, 2)}
        </pre>
      )}
    </div>
  )
}
