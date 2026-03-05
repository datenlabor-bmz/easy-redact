'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Trash2, Bot, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useChatStream } from './useChatStream'
import { useTranslations, useLocale } from 'next-intl'
import type { ConsentMode, RedactionMode, RedactionSuggestion, TextRangeSuggestion, PageRangeSuggestion, ChatMessage as Msg, Redaction, DocumentMeta, DocumentPage } from '@/types'

interface ChatPanelProps {
  consent: ConsentMode
  redactionMode: RedactionMode
  foiJurisdiction?: string
  documentPages?: DocumentPage[]
  documents?: DocumentMeta[]
  redactions?: Redaction[]
  documentNames?: string[]
  initialMessages?: Msg[]
  triggerRef?: React.MutableRefObject<((msg: string) => void) | null>
  onDeferredTrigger?: (msg: string) => void
  onSuggestionsReceived: (suggestions: RedactionSuggestion[], textRanges: TextRangeSuggestion[], pageRanges: PageRangeSuggestion[], remove: string[]) => void
  onMessagesChange?: (messages: Msg[]) => void
  modeSelector?: React.ReactNode
}

export function ChatPanel({
  consent, redactionMode, foiJurisdiction, documentPages, documents, redactions, documentNames, initialMessages, triggerRef, onDeferredTrigger,
  onSuggestionsReceived, onMessagesChange, modeSelector,
}: ChatPanelProps) {
  const t = useTranslations('ChatPanel')
  const locale = useLocale()
  const { messages, isStreaming, error, sendMessage, stopStreaming, addSilentContext, setMessages } =
    useChatStream({ consent, redactionMode, foiJurisdiction, documentPages, documents, redactions, locale, onSuggestionsReceived })

  const { scrollRef, contentRef } = useStickToBottom({ initial: 'smooth', resize: 'smooth' })
  const initialLoaded = useRef(false)

  useEffect(() => { if (triggerRef) triggerRef.current = sendMessage }, [triggerRef, sendMessage])

  useEffect(() => {
    if (initialLoaded.current) return
    initialLoaded.current = true
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    } else if (documentNames?.length) {
      onDeferredTrigger?.(`Documents loaded: ${documentNames.join(', ')}. Access already granted. Greet the user briefly, call read_documents IMMEDIATELY, then suggest redactions.`)
    } else {
      sendMessage(`[System: Greet the user briefly, explain what you can do, and ask them to upload a document.]`)
    }
  }, [initialMessages, setMessages, sendMessage])

  useEffect(() => {
    if (messages.length > 0) onMessagesChange?.(messages)
  }, [messages, onMessagesChange])

  const handleOptionSelect = useCallback((msgId: string, optId: string, label: string) => {
    setMessages(messages.map((m: Msg) =>
      m.id === msgId && m.question ? { ...m, question: { ...m.question, answered: true } } : m
    ))
    sendMessage(label)
  }, [messages, setMessages, sendMessage])

  return (
    <div className='flex flex-col h-full bg-card'>
      <div className='shrink-0 h-11 flex items-center justify-between gap-1 px-3 border-b bg-muted/50'>
        <span className='text-xs font-medium text-foreground'>{t('header')}</span>
        <div className='flex items-center gap-1'>
          {modeSelector}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground hover:text-destructive'
              onClick={() => { setMessages([]); onMessagesChange?.([]) }}>
              <Trash2 className='h-3.5 w-3.5' />
            </Button>
          </TooltipTrigger>
          <TooltipContent side='bottom'>{t('clearConversation')}</TooltipContent>
        </Tooltip>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className='flex-1 overflow-y-auto relative'>
        <div ref={contentRef} className='p-4 space-y-4 min-h-full'>
          {messages.length === 0 ? (
            <div className='flex flex-col items-center justify-center h-full text-center py-12 gap-3'>
              <Bot className='h-10 w-10 text-muted-foreground/40' />
              <p className='text-sm text-muted-foreground max-w-xs'>
                {t('emptyState')}
              </p>
            </div>
          ) : (
            messages.map((m, i) => {
              const thinking = isStreaming && i === messages.length - 1 && m.role === 'assistant' && !m.content
              return <ChatMessage key={m.id} message={m} onOptionSelect={handleOptionSelect} isThinking={thinking} />
            })
          )}

          {error && (
            <div className='flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive'>
              <ShieldAlert className='h-4 w-4 shrink-0 mt-0.5' />
              {error}
            </div>
          )}
        </div>

      </div>

      {/* Input */}
      <div className='shrink-0 p-3'>
        <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
      </div>
    </div>
  )
}

export { useChatStream }
