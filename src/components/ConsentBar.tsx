'use client'

import { Cloud, Server, Brain, Globe, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ConsentMode } from '@/types'

interface ConsentBarProps {
  consent: ConsentMode
  onConsentChange: (mode: ConsentMode) => void
}

const OPTIONS: Array<{ mode: ConsentMode; label: string; icon: React.ElementType; desc: string; implemented: boolean }> = [
  { mode: null, label: 'Nicht freigegeben', icon: Lock, desc: 'Kein Dokumentinhalt wird geteilt', implemented: true },
  { mode: 'cloud', label: 'Cloud-KI', icon: Cloud, desc: 'Azure OpenAI (DSGVO-konform, keine Data Retention)', implemented: true },
  { mode: 'local', label: 'Lokales LLM', icon: Server, desc: 'Ollama auf Ihrem GPU-Server', implemented: true },
]

const STUB_OPTIONS = [
  { label: 'spaCy NLP', icon: Brain, desc: 'Lokale NLP-Verarbeitung (Docker only)' },
  { label: 'Browser NLP', icon: Globe, desc: 'In-Browser Transformer (in Entwicklung)' },
]

export function ConsentBar({ consent, onConsentChange }: ConsentBarProps) {
  return (
    <div className='flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border-b text-xs'>
      <span className='text-muted-foreground font-medium mr-1 shrink-0'>Datenverarbeitung:</span>
      {OPTIONS.map(opt => {
        const Icon = opt.icon
        const active = consent === opt.mode
        return (
          <Tooltip key={String(opt.mode)}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onConsentChange(opt.mode)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full border transition-all ${
                  active
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                }`}>
                <Icon className='h-3 w-3' />
                <span>{opt.label}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side='bottom'><p>{opt.desc}</p></TooltipContent>
          </Tooltip>
        )
      })}
      {STUB_OPTIONS.map(opt => {
        const Icon = opt.icon
        return (
          <Tooltip key={opt.label}>
            <TooltipTrigger asChild>
              <button disabled
                className='flex items-center gap-1 px-2 py-1 rounded-full border border-dashed border-border text-muted-foreground/50 cursor-not-allowed'>
                <Icon className='h-3 w-3' />
                <span>{opt.label}</span>
                <Badge variant='outline' className='ml-0.5 text-[9px] px-1 py-0 h-3.5'>bald</Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent side='bottom'><p>{opt.desc}</p></TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
