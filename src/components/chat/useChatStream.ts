'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, ToolCall, SSEEvent, AskUserQuestion, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion, AiMode, RedactionMode, ApiChatMessage, Redaction, RedactionSnapshot, DocumentPage } from '@/types'

export type { ChatMessage, ToolCall }

interface UseChatStreamOptions {
  aiMode: AiMode
  redactionMode: RedactionMode
  foiJurisdiction?: string
  documentKey: string
  documentName: string
  documentPages?: DocumentPage[]
  redactions?: Redaction[]
  locale?: string
  onSuggestionsReceived?: (suggestions: RedactionSuggestion[], textRanges: TextRangeSuggestion[], pageRanges: PageRangeSuggestion[], remove: string[]) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function useChatStream(opts: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const sendMessage = useCallback(async (content: string) => {
    if (abortRef.current) {
      console.warn('[chat] sendMessage called while already streaming — ignoring')
      return
    }
    const isSystem = content.startsWith('[System:')
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content, timestamp: new Date().toISOString(), hidden: isSystem }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setError(null)

    const assistantId = generateId()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', toolCalls: [], timestamp: new Date().toISOString() }])

    const allMessages = await new Promise<ChatMessage[]>(resolve => {
      setMessages(prev => { resolve(prev); return prev })
    })

    // Reconstruct full OpenAI message format including tool call/result pairs
    const history = allMessages.filter(m => m.id !== assistantId)

    // A read_documents result embeds the full text of every open document. Once a
    // later call supersedes it, replaying the old one forever both wastes context
    // and — if a document was closed or replaced meanwhile — feeds the model text
    // from a document that no longer exists. Only the most recent call's result
    // needs to survive; the model can always call read_documents again.
    const lastReadDocumentsId = [...history].reverse()
      .find(m => m.toolCalls?.some(tc => tc.name === 'read_documents'))?.id

    const apiMessages: ApiChatMessage[] = []
    for (const m of history) {
      if (m.role === 'user') {
        if (m.content) apiMessages.push({ role: 'user', content: m.content })
      } else {
        if (m.toolCalls?.length) {
          apiMessages.push({
            // Null rather than '' for a tool-call-only turn, matching the server side.
            role: 'assistant', content: m.content || null,
            tool_calls: m.toolCalls.map(tc => ({
              id: tc.id, type: 'function' as const,
              function: { name: tc.name, arguments: JSON.stringify(tc.args) },
            })),
          })
          for (const tc of m.toolCalls) {
            const stale = tc.name === 'read_documents' && m.id !== lastReadDocumentsId
            const content = stale
              ? JSON.stringify('[superseded by a later read_documents call — call read_documents again if you need current document content]')
              : JSON.stringify(tc.result ?? '')
            apiMessages.push({ role: 'tool', tool_call_id: tc.id, content })
          }
        } else if (m.content) {
          apiMessages.push({ role: 'assistant', content: m.content })
        }
      }
    }

    const { redactionMode, foiJurisdiction, documentKey, documentName, documentPages, redactions, locale } = optsRef.current
    const effectiveAiMode = optsRef.current.aiMode

    // This conversation is scoped to one document — only its own pages and
    // redactions are ever sent, so there is nothing else for the model to see or
    // accidentally act on, and no cross-document bookkeeping for it to get wrong.
    const scopedDocumentPages = documentPages?.filter(p => p.documentKey === documentKey)
    const currentRedactions: RedactionSnapshot[] | undefined = redactions?.length
      ? redactions.filter(r => r.status !== 'ignored' && r.documentKey === documentKey).map(r => ({
          id: r.id,
          status: r.status,
          pageIndex: r.pageIndex,
          text: r.searchText ?? '(freehand)',
          person: r.person,
          personGroup: r.personGroup,
          documentKey: r.documentKey,
          documentName,
        }))
      : undefined

    console.log('[chat] sendMessage', { content: content.slice(0, 80), effectiveAiMode, apiMessageCount: apiMessages.length })
    console.log('[chat] apiMessages', apiMessages.map(m => ({ role: m.role, content: m.content?.slice(0, 60) })))

    abortRef.current = new AbortController()
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: effectiveAiMode === 'local' ? 'local' : 'cloud',
          aiMode: effectiveAiMode, redactionMode, foiJurisdiction,
          documentPages: scopedDocumentPages,
          currentRedactions,
          locale,
          primaryDocumentKey: documentKey,
          primaryDocumentName: documentName,
        }),
        signal: abortRef.current.signal,
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let toolIdx = -1

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const chunks = buffer.split('\n\n')
        buffer = chunks.pop() ?? ''

        for (const chunk of chunks) {
          if (!chunk.startsWith('data: ')) continue
          try {
            const event: SSEEvent = JSON.parse(chunk.slice(6))
            if (event.type !== 'text_delta') console.log('[chat] SSE event', event.type, event)
            switch (event.type) {
              case 'text_delta':
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + event.content } : m))
                break
              case 'tool_start':
                toolIdx++
                setMessages(prev => prev.map(m => m.id === assistantId
                  ? { ...m, toolCalls: [...(m.toolCalls ?? []), { id: event.id, name: event.name, args: event.args, status: 'running' }] }
                  : m))
                break
              case 'tool_result':
                setMessages(prev => prev.map(m => m.id === assistantId
                  ? { ...m, toolCalls: m.toolCalls?.map((tc, i) => i === toolIdx ? { ...tc, result: event.result, success: event.success, status: event.success ? 'complete' : 'error' } : tc) }
                  : m))
                break
              case 'ask_user':
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, question: event.question } : m))
                break
              case 'suggest_redactions':
                optsRef.current.onSuggestionsReceived?.(event.suggestions, event.textRanges ?? [], event.pageRanges ?? [], event.remove ?? [])
                break
              case 'error':
                setError(event.message)
                break
            }
          } catch { /* skip bad JSON */ }
        }
      }
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError'))
        setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsStreaming(false)
      abortRef.current = null
    }
  }, [])

  const addSilentContext = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: generateId(), role: 'user', content, timestamp: new Date().toISOString(), hidden: true,
    }])
  }, [])

  const stopStreaming = useCallback(() => { abortRef.current?.abort() }, [])
  const setMessagesDirectly = useCallback((msgs: ChatMessage[]) => { setMessages(msgs) }, [])

  return { messages, isStreaming, error, sendMessage, stopStreaming, addSilentContext, setMessages: setMessagesDirectly }
}
