'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Loader2, Check, AlertCircle,
  FileSearch, MessageSquare, Lightbulb, Brain, Lock } from 'lucide-react'
import type { ToolCall } from './useChatStream'

const TOOL_ICONS: Record<string, React.ElementType> = {
  read_documents: FileSearch,
  ask_user: MessageSquare,
  suggest_redactions: Lightbulb,
  request_document_access: Lock,
  start_nlp_processing: Brain,
}

const TOOL_LABELS: Record<string, string> = {
  read_documents: 'Dokumente lesen',
  ask_user: 'Frage an den Nutzer',
  suggest_redactions: 'Schwärzungen vorschlagen',
  request_document_access: 'Dokumentenzugriff anfragen',
  start_nlp_processing: 'NLP-Verarbeitung starten',
}

export function ChatToolCall({ toolCall }: { toolCall: ToolCall }) {
  if (toolCall.name === 'ask_user') return null
  const [expanded, setExpanded] = useState(false)
  const Icon = TOOL_ICONS[toolCall.name] ?? Brain
  const label = TOOL_LABELS[toolCall.name] ?? toolCall.name

  const statusCls = {
    pending: 'bg-muted text-muted-foreground',
    running: 'bg-blue-100 text-blue-700',
    complete: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700',
  }[toolCall.status]

  return (
    <div className={`border rounded-xl overflow-hidden ${toolCall.status === 'error' ? 'border-red-200 bg-red-50/50' : 'border-border bg-card shadow-sm'}`}>
      <button onClick={() => setExpanded(!expanded)}
        className='w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-muted/50 transition-colors'>
        <div className={`p-1.5 rounded-lg ${toolCall.status === 'error' ? 'bg-red-100' : 'bg-muted'}`}>
          <Icon className={`h-3.5 w-3.5 ${toolCall.status === 'error' ? 'text-red-600' : 'text-muted-foreground'}`} />
        </div>
        <span className='flex-1 text-sm font-medium truncate'>{label}</span>
        <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
          {toolCall.status === 'running' && <Loader2 className='h-3 w-3 animate-spin' />}
          {toolCall.status === 'complete' && <Check className='h-3 w-3' />}
          {toolCall.status === 'error' && <AlertCircle className='h-3 w-3' />}
          {toolCall.status === 'running' ? 'Läuft…' : toolCall.status === 'complete' ? 'Fertig' : toolCall.status === 'error' ? 'Fehler' : 'Ausstehend'}
        </span>
        {toolCall.result !== undefined && (
          expanded ? <ChevronDown className='h-4 w-4 text-muted-foreground' /> : <ChevronRight className='h-4 w-4 text-muted-foreground' />
        )}
      </button>
      {expanded && toolCall.result !== undefined && (
        <div className='px-3 pb-3 pt-1 border-t border-border text-xs'>
          <pre className='bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground'>
            {JSON.stringify(toolCall.result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
