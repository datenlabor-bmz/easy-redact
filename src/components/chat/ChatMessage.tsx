'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, Cloud, Server, ShieldCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatToolCall } from './ChatToolCall'
import { useTranslations } from 'next-intl'
import type { ChatMessage as Msg, ConsentMode } from '@/types'

export function ChatMessage({ message, onOptionSelect, onConsentGrant, isThinking }: {
  message: Msg
  onOptionSelect?: (questionId: string, optionId: string, label: string) => void
  onConsentGrant?: (mode: ConsentMode) => void
  isThinking?: boolean
}) {
  const t = useTranslations('ChatMessage')
  const isUser = message.role === 'user'
  if (message.hidden) return null
  if (!message.content && !message.toolCalls?.length && !message.question && !isThinking) return null

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${isUser ? 'mt-0.5' : 'mt-0.5'} ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {isUser ? <User className='h-3.5 w-3.5' /> : <Bot className='h-3.5 w-3.5' />}
      </div>

      <div className={`${isUser ? 'max-w-[85%]' : 'flex-1 min-w-0'} ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Tool calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className='space-y-2 mb-2 w-full max-w-[95%]'>
            {message.toolCalls.map((tc, i) => <ChatToolCall key={i} toolCall={tc} />)}
          </div>
        )}

        {/* Thinking indicator */}
        {isThinking && !message.content && (
          <div className='flex items-center gap-2 px-3.5 py-2.5 bg-muted rounded-2xl rounded-tl-sm text-sm text-muted-foreground'>
            <Loader2 className='h-3.5 w-3.5 animate-spin shrink-0' /> {t('thinking')}
          </div>
        )}

        {/* Content */}
        {message.content && (
          <div className='relative group/msg'>
            <div className={`inline-block rounded-2xl px-3.5 py-2.5 text-sm ${
              isUser ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted text-foreground rounded-tl-sm max-w-[95%]'
            }`}>
              {isUser ? (
                <p className='whitespace-pre-wrap'>{message.content}</p>
              ) : (
                <div className='prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:my-1.5 prose-pre:bg-background prose-code:bg-background/80 prose-code:px-1 prose-code:rounded prose-code:before:content-[""] prose-code:after:content-[""]'>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Inline consent request box */}
        {!isUser && message.consentRequired && (
          <div className='mt-2 w-full max-w-[95%] rounded-xl border bg-muted/30 overflow-hidden'>
            <div className='px-3 py-2 border-b bg-muted/50 flex items-center gap-2'>
              <ShieldCheck className='h-3.5 w-3.5 text-amber-500 shrink-0' />
              <span className='text-xs font-medium'>{t('documentAccessRequired')}</span>
            </div>
            <div className='px-3 py-2 text-xs text-muted-foreground border-b'>
              {message.consentRequired}
            </div>
            <div className='p-2 flex flex-col gap-1.5'>
              <button onClick={() => onConsentGrant?.('cloud')}
                className='flex items-center gap-2.5 px-3 py-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left text-xs group'>
                <Cloud className='h-4 w-4 text-blue-500 shrink-0' />
                <div>
                  <p className='font-medium group-hover:text-primary'>{t('cloudLabel')}</p>
                  <p className='text-muted-foreground mt-0.5'>{t('cloudDesc')}</p>
                </div>
              </button>
              {process.env.NEXT_PUBLIC_LOCAL_LLM_ENABLED === 'true' ? (
                <button onClick={() => onConsentGrant?.('local')}
                  className='flex items-center gap-2.5 px-3 py-2 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all text-left text-xs group'>
                  <Server className='h-4 w-4 text-green-500 shrink-0' />
                  <div>
                    <p className='font-medium group-hover:text-primary'>{t('localLabel')}</p>
                    <p className='text-muted-foreground mt-0.5'>{t('localDesc')}</p>
                  </div>
                </button>
              ) : (
                <div className='flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dashed text-xs text-muted-foreground/50 cursor-not-allowed'>
                  <Server className='h-4 w-4 shrink-0' />
                  <div>
                    <p className='font-medium'>{t('localLabel')}</p>
                    <p className='mt-0.5'>{t('localNotConfigured')} <span className='text-[10px]'>({t('comingSoon')})</span></p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ask-user structured question */}
        {!isUser && message.question && (
          <>
            {!message.content && (
              <div className='relative group/msg'>
                <div className='inline-block rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[95%] text-sm bg-muted text-foreground'>
                  <p>{message.question.question}</p>
                </div>
              </div>
            )}
            {!message.question.answered && (
              <div className='self-end flex flex-col items-end gap-1.5 mt-2'>
                {message.question.options.map(opt => (
                  <Button key={opt.id} variant='outline' size='sm'
                    className='text-xs h-7 rounded-full'
                    onClick={() => onOptionSelect?.(message.id, opt.id, opt.label)}>
                    {opt.label}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
