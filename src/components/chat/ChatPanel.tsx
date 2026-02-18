'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useStickToBottom } from 'use-stick-to-bottom'
import { Trash2, Bot, ShieldAlert } from 'lucide-react'
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
  documentNames?: string[]
  initialMessages?: Msg[]
  triggerRef?: React.MutableRefObject<((msg: string) => void) | null>
  onDeferredTrigger?: (msg: string) => void  // for triggers that need pages to be ready first
  onSuggestionsReceived: (suggestions: RedactionSuggestion[]) => void
  onRedactionAction?: (redactionId: string, action: 'accepted' | 'ignored') => void
  onMessagesChange?: (messages: Msg[]) => void
  session: Session
  onConsentChange: (mode: ConsentMode) => void
  onRedactionModeChange: (mode: RedactionMode) => void
  onFoiJurisdictionChange: (id: string) => void
  onModelSettingsChange: (key: keyof Session['modelSettings'], value: string) => void
}

export function ChatPanel({
  consent, redactionMode, foiJurisdiction, documentPages, documentNames, initialMessages, triggerRef, onDeferredTrigger,
  onSuggestionsReceived, onRedactionAction, onMessagesChange,
  session, onConsentChange, onRedactionModeChange, onFoiJurisdictionChange, onModelSettingsChange,
}: ChatPanelProps) {
  const { messages, isStreaming, error, sendMessage, stopStreaming, addSilentContext, grantConsent, setMessages } =
    useChatStream({
      consent, redactionMode, foiJurisdiction, documentPages,
      onSuggestionsReceived,
      onConsentGranted: onConsentChange,
    })

  const { scrollRef, contentRef } = useStickToBottom({ initial: 'smooth', resize: 'smooth' })
  const initialLoaded = useRef(false)

  // Expose sendMessage for external triggers (e.g. on document upload)
  useEffect(() => { if (triggerRef) triggerRef.current = sendMessage }, [triggerRef, sendMessage])

  // Load persisted messages or trigger welcome on mount
  useEffect(() => {
    if (initialLoaded.current) return
    initialLoaded.current = true
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages)
    } else {
      const hasDocs = !!documentNames?.length
      const hasConsent = !!consent
      let msg: string
      if (hasDocs && hasConsent) {
        // Defer until document pages are extracted — don't trigger immediately or read_documents will fail
        onDeferredTrigger?.(`Dokumente geladen: ${documentNames!.join(', ')}. Zugriff bereits erteilt. Begrüße den Nutzer kurz, rufe SOFORT read_documents auf und mache dann Schwärzungsvorschläge.`)
        return
      } else if (hasDocs) {
        msg = `Dokumente geladen: ${documentNames!.join(', ')}. Begrüße den Nutzer kurz, erkläre was du tun kannst, und fordere Dokumentenzugriff an.`
      } else {
        msg = `Begrüße den Nutzer kurz, erkläre was du tun kannst, und bitte ihn, ein Dokument hochzuladen.`
      }
      sendMessage(`[System: ${msg}]`)
    }
  }, [initialMessages, setMessages, sendMessage])

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
            messages.map((m, i) => {
              const thinking = isStreaming && i === messages.length - 1 && m.role === 'assistant' && !m.content
              return <ChatMessage key={m.id} message={m} onOptionSelect={handleOptionSelect} onConsentGrant={grantConsent} isThinking={thinking} />
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
