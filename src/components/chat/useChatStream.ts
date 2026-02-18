'use client'

import { useState, useCallback, useRef } from 'react'
import type { ChatMessage, ToolCall, SSEEvent, AskUserQuestion, RedactionSuggestion, ConsentMode, RedactionMode, ApiChatMessage } from '@/types'

export type { ChatMessage, ToolCall }

interface UseChatStreamOptions {
  consent: ConsentMode
  redactionMode: RedactionMode
  foiJurisdiction?: string
  documentPages?: Array<{ pageIndex: number; text: string }>
  onConsentRequired?: (reason: string) => void
  onSuggestionsReceived?: (suggestions: RedactionSuggestion[]) => void
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
    const userMsg: ChatMessage = { id: generateId(), role: 'user', content, timestamp: new Date().toISOString() }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setError(null)

    const assistantId = generateId()
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', toolCalls: [], timestamp: new Date().toISOString() }])

    // Build API messages from current state
    const allMessages = await new Promise<ChatMessage[]>(resolve => {
      setMessages(prev => { resolve(prev); return prev })
    })
    const apiMessages: ApiChatMessage[] = allMessages
      .filter(m => !m.hidden)
      .map(m => ({ role: m.role, content: m.content }))

    const { consent, redactionMode, foiJurisdiction, documentPages } = optsRef.current

    abortRef.current = new AbortController()
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: consent === 'local' ? 'local' : 'cloud',
          consent, redactionMode, foiJurisdiction,
          documentPages: consent ? documentPages : undefined,
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
            switch (event.type) {
              case 'text_delta':
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: m.content + event.content } : m))
                break
              case 'tool_start':
                toolIdx++
                setMessages(prev => prev.map(m => m.id === assistantId
                  ? { ...m, toolCalls: [...(m.toolCalls ?? []), { name: event.name, args: event.args, status: 'running' }] }
                  : m))
                break
              case 'tool_result':
                setMessages(prev => prev.map(m => m.id === assistantId
                  ? { ...m, toolCalls: m.toolCalls?.map((tc, i) => i === toolIdx ? { ...tc, result: event.result, success: event.success, status: event.success ? 'complete' : 'error' } : tc) }
                  : m))
                break
              case 'consent_required':
                optsRef.current.onConsentRequired?.(event.reason)
                break
              case 'ask_user':
                setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, question: event.question } : m))
                break
              case 'suggest_redactions':
                optsRef.current.onSuggestionsReceived?.(event.suggestions)
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

  // Silently add context (user accept/ignore actions, consent decisions)
  const addSilentContext = useCallback((content: string) => {
    setMessages(prev => [...prev, {
      id: generateId(), role: 'user', content, timestamp: new Date().toISOString(), hidden: true,
    }])
  }, [])

  const stopStreaming = useCallback(() => { abortRef.current?.abort() }, [])

  const setMessagesDirectly = useCallback((msgs: ChatMessage[]) => { setMessages(msgs) }, [])

  return { messages, isStreaming, error, sendMessage, stopStreaming, addSilentContext, setMessages: setMessagesDirectly }
}
