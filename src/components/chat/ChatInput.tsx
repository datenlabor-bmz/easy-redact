'use client'

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ChatInput({ onSend, onStop, isStreaming, placeholder = 'Fragen Sie den Assistenten…', suggestions = [] }: {
  onSend: (msg: string) => void
  onStop?: () => void
  isStreaming: boolean
  placeholder?: string
  suggestions?: string[]
}) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${Math.min(ref.current.scrollHeight, 180)}px`
    }
  }, [value])

  const send = () => {
    const t = value.trim()
    if (!t || isStreaming) return
    onSend(t); setValue('')
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className='space-y-2'>
      {suggestions.length > 0 && !value && (
        <div className='flex gap-2 overflow-x-auto pb-1 scrollbar-hide'>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => onSend(s)}
              className='shrink-0 px-3 py-1.5 text-xs bg-background hover:bg-muted text-foreground rounded-full border transition-colors whitespace-nowrap'>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className='relative bg-background border rounded-2xl shadow-sm focus-within:ring-1 focus-within:ring-ring transition-all'>
        <textarea ref={ref} value={value} onChange={e => setValue(e.target.value)}
          onKeyDown={onKey} placeholder={placeholder} disabled={isStreaming} rows={1}
          className='w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-[180px] py-3 pl-4 pr-12' />
        <div className='absolute right-2 bottom-2'>
          {isStreaming ? (
            <Button variant='outline' size='icon' onClick={onStop} className='h-8 w-8 rounded-lg'>
              <Square className='h-4 w-4' />
            </Button>
          ) : (
            <Button size='icon' onClick={send} disabled={!value.trim()} className='h-8 w-8 rounded-lg'>
              <ArrowUp className='h-4 w-4' />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
