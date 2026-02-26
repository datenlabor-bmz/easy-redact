'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, ToolCall, SSEEvent, AskUserQuestion, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion, ConsentMode, RedactionMode, ApiChatMessage, Redaction, RedactionSnapshot, DocumentMeta, DocumentPage } from '@/types'

export type { ChatMessage, ToolCall }

interface UseChatStreamOptions {
  consent: ConsentMode
  redactionMode: RedactionMode
  foiJurisdiction?: string
  documentPages?: DocumentPage[]
  documents?: DocumentMeta[]
  redactions?: Redaction[]
  locale?: string
  onSuggestionsReceived?: (suggestions: RedactionSuggestion[], textRanges: TextRangeSuggestion[], pageRanges: PageRangeSuggestion[], remove: string[]) => void
  onConsentGranted?: (mode: ConsentMode) => void
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export function useChatStream(opts: UseChatStreamOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts

  const sendMessage = useCallback(async (content: string, overrideConsent?: ConsentMode) => {
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
    const apiMessages: ApiChatMessage[] = []
    for (const m of history) {
      if (m.role === 'user') {
        if (m.content) apiMessages.push({ role: 'user', content: m.content })
      } else {
        if (m.toolCalls?.length) {
          apiMessages.push({
            role: 'assistant', content: m.content,
            tool_calls: m.toolCalls.map(tc => ({
              id: tc.id, type: 'function' as const,
              function: { name: tc.name, arguments: JSON.stringify(tc.args) },
            })),
          })
          for (const tc of m.toolCalls) {
            apiMessages.push({ role: 'tool', tool_call_id: tc.id, content: JSON.stringify(tc.result ?? '') })
          }
        } else if (m.content) {
          apiMessages.push({ role: 'assistant', content: m.content })
        }
      }
    }

    const { redactionMode, foiJurisdiction, documentPages, documents, redactions, locale } = optsRef.current
    const effectiveConsent = overrideConsent ?? optsRef.current.consent

    const docNameMap = Object.fromEntries((documents ?? []).map(d => [d.idbKey, d.name]))
    const currentRedactions: RedactionSnapshot[] | undefined = redactions?.length
      ? redactions.filter(r => r.status !== 'ignored').map(r => ({
          id: r.id,
          status: r.status,
          pageIndex: r.pageIndex,
          text: r.searchText ?? '(freehand)',
          person: r.person,
          personGroup: r.personGroup,
          documentKey: r.documentKey,
          documentName: docNameMap[r.documentKey],
        }))
      : undefined

    console.log('[chat] sendMessage', { content: content.slice(0, 80), effectiveConsent, apiMessageCount: apiMessages.length })
    console.log('[chat] apiMessages', apiMessages.map(m => ({ role: m.role, content: m.content?.slice(0, 60) })))

    abortRef.current = new AbortController()
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: effectiveConsent === 'local' ? 'local' : 'cloud',
          consent: effectiveConsent, redactionMode, foiJurisdiction,
          documentPages: effectiveConsent ? documentPages : undefined,
          currentRedactions,
          locale,
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
              case 'consent_required':
                // Attach consent request to the current assistant message for inline rendering
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, consentRequired: event.reason } : m))
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

  // Called when user grants consent from inline box — updates session and resumes with a silent message
  const grantConsent = useCallback((mode: ConsentMode) => {
    console.log('[chat] grantConsent', mode, 'documentPages:', optsRef.current.documentPages?.length)
    optsRef.current.onConsentGranted?.(mode)
    setMessages(prev => prev.map(m => m.consentRequired ? { ...m, consentRequired: undefined } : m))
    sendMessage(`[System: Document access granted (${mode}). Now call read_documents and then suggest redactions.]`, mode)
  }, [sendMessage])

  const addSilentContext = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: generateId(), role: 'user', content, timestamp: new Date().toISOString(), hidden: true,
    }])
  }, [])

  const stopStreaming = useCallback(() => { abortRef.current?.abort() }, [])
  const setMessagesDirectly = useCallback((msgs: ChatMessage[]) => { setMessages(msgs) }, [])

  return { messages, isStreaming, error, sendMessage, stopStreaming, addSilentContext, grantConsent, setMessages: setMessagesDirectly }
}
