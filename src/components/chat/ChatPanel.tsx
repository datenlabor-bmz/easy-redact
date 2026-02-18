'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Trash2, ArrowDown, Loader2, Bot, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { useChatStream } from './useChatStream'
import { SettingsPopover } from '@/components/SettingsPopover'
import type { ConsentMode, RedactionMode, RedactionSuggestion, ChatMessage as Msg, Session } from '@/types'

interface ChatPanelProps {
  consent: ConsentMode
  redactionMode: RedactionMode
  foiJurisdiction?: string
  documentPages?: Array<{ pageIndex: number; text: string }>
  initialMessages?: Msg[]
  onConsentRequired: (reason: string) => void
  onSuggestionsReceived: (suggestions: RedactionSuggestion[]) => void
  onRedactionAction?: (redactionId: string, action: 'accepted' | 'ignored') => void
  onMessagesChange?: (messages: Msg[]) => void
  // Settings passed through for the header popover
  session: Session
  onConsentChange: (mode: ConsentMode) => void
  onRedactionModeChange: (mode: RedactionMode) => void
  onFoiJurisdictionChange: (id: string) => void
  onModelSettingsChange: (key: keyof Session['modelSettings'], value: string) => void
}

export function ChatPanel({
  consent, redactionMode, foiJurisdiction, documentPages, initialMessages,
  onConsentRequired, onSuggestionsReceived, onRedactionAction, onMessagesChange,
  session, onConsentChange, onRedactionModeChange, onFoiJurisdictionChange, onModelSettingsChange,
}: ChatPanelProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, addSilentContext, setMessages } =
    useChatStream({ consent, redactionMode, foiJurisdiction, documentPages, onConsentRequired, onSuggestionsReceived })

  const { scrollRef, contentRef, isAtBottom, scrollToBottom } = useStickToBottom({ initial: 'smooth', resize: 'smooth' })
  const initialLoaded = useRef(false)

  // Load persisted messages on mount
  useEffect(() => {
    if (!initialLoaded.current && initialMessages && initialMessages.length > 0) {
      initialLoaded.current = true
      setMessages(initialMessages)
    }
  }, [initialMessages, setMessages])

  // Persist messages when they change
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
      {/* Panel header */}
      <div className='shrink-0 h-11 flex items-center justify-between px-3 border-b bg-muted/50'>
        <span className='text-xs font-medium text-foreground'>Schwärzungs-Assistent</span>
        <div className='flex items-center gap-1'>
          <SettingsPopover session={session}
            onConsentChange={onConsentChange}
            onRedactionModeChange={onRedactionModeChange}
            onFoiJurisdictionChange={onFoiJurisdictionChange}
            onModelSettingsChange={onModelSettingsChange} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant='ghost' size='icon' className='h-6 w-6 text-muted-foreground hover:text-destructive'
                onClick={() => { setMessages([]); onMessagesChange?.([]) }}>
                <Trash2 className='h-3.5 w-3.5' />
              </Button>
            </TooltipTrigger>
            <TooltipContent side='bottom'>Gespräch löschen</TooltipContent>
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
                Ich bin Ihr KI-Assistent für die Dokumentenschwärzung. Laden Sie ein Dokument hoch und beginnen Sie das Gespräch.
              </p>
            </div>
          ) : (
            messages.map(m => <ChatMessage key={m.id} message={m} onOptionSelect={handleOptionSelect} />)
          )}

          {isStreaming && messages.length > 0 && !messages[messages.length - 1]?.content && (
            <div className='flex gap-3'>
              <div className='shrink-0 w-7 h-7 rounded-full bg-muted flex items-center justify-center'>
                <Bot className='h-3.5 w-3.5 text-muted-foreground' />
              </div>
              <div className='flex items-center gap-2 px-3 py-2 bg-muted rounded-lg text-sm text-muted-foreground'>
                <Loader2 className='h-3.5 w-3.5 animate-spin' /> Denke nach…
              </div>
            </div>
          )}

          {error && (
            <div className='flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive'>
              <ShieldAlert className='h-4 w-4 shrink-0 mt-0.5' />
              {error}
            </div>
          )}
        </div>

        {!isAtBottom && messages.length > 0 && (
          <Button variant='secondary' size='sm' onClick={() => scrollToBottom()}
            className='absolute bottom-4 left-1/2 -translate-x-1/2 shadow-md rounded-full'>
            <ArrowDown className='h-3.5 w-3.5 mr-1' /> Nach unten
          </Button>
        )}
      </div>

      {/* Input */}
      <div className='shrink-0 p-3'>
        <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
      </div>
    </div>
  )
}

export { useChatStream }
