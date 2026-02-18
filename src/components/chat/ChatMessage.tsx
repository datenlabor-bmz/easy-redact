'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { User, Bot, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatToolCall } from './ChatToolCall'
import type { ChatMessage as Msg } from './useChatStream'

export function ChatMessage({ message, onOptionSelect }: {
  message: Msg
  onOptionSelect?: (questionId: string, optionId: string, label: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  if (message.hidden) return null

  const copy = async () => {
    await navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex gap-3 group ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs ${isUser ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
        {isUser ? <User className='h-3.5 w-3.5' /> : <Bot className='h-3.5 w-3.5' />}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Tool calls */}
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className='space-y-2 mb-2 w-full max-w-[95%]'>
            {message.toolCalls.map((tc, i) => <ChatToolCall key={i} toolCall={tc} />)}
          </div>
        )}

        {/* Content */}
        {message.content && (
          <div className='relative group/msg'>
            <div className={`inline-block rounded-2xl px-3.5 py-2.5 max-w-[95%] text-sm ${
              isUser ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'
            }`}>
              {isUser ? (
                <p className='whitespace-pre-wrap'>{message.content}</p>
              ) : (
                <div className='prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-pre:my-1.5 prose-pre:bg-background prose-code:bg-background/80 prose-code:px-1 prose-code:rounded prose-code:before:content-[""] prose-code:after:content-[""]'>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
            </div>
            {!isUser && (
              <button onClick={copy} className='absolute -bottom-5 left-1 opacity-0 group-hover/msg:opacity-100 transition-opacity p-1 rounded text-muted-foreground hover:text-foreground'>
                {copied ? <Check className='h-3 w-3 text-green-500' /> : <Copy className='h-3 w-3' />}
              </button>
            )}
          </div>
        )}

        {/* Ask-user structured question */}
        {!isUser && message.question && !message.question.answered && (
          <div className='mt-2 flex flex-wrap gap-2 max-w-[95%]'>
            {message.question.options.map(opt => (
              <Button key={opt.id} variant='outline' size='sm'
                className='text-xs h-7 rounded-full'
                onClick={() => onOptionSelect?.(message.id, opt.id, opt.label)}>
                {opt.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
