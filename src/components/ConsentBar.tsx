'use client'

import { Cloud, Server, Brain, Globe, Hand } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'
import type { ConsentMode } from '@/types'

const spacyEnabled = process.env.NEXT_PUBLIC_SPACY_ENABLED === 'true'

interface ConsentBarProps {
  consent: ConsentMode
  onConsentChange: (mode: ConsentMode) => void
}

export function ConsentBar({ consent, onConsentChange }: ConsentBarProps) {
  const t = useTranslations('ConsentBar')

  const OPTIONS: Array<{ mode: ConsentMode; label: string; icon: React.ElementType; desc: string }> = [
    { mode: null,    label: t('manualOnly'),  icon: Hand,   desc: t('manualOnlyDesc') },
    { mode: 'cloud', label: t('cloudLabel'),  icon: Cloud,  desc: t('cloudDesc') },
    { mode: 'local', label: t('localLabel'),  icon: Server, desc: t('localDesc') },
    ...(spacyEnabled ? [{ mode: 'spacy' as ConsentMode, label: t('spacyLabel'), icon: Brain, desc: t('spacyDesc') }] : []),
  ]

  const STUB_OPTIONS = [
    ...(!spacyEnabled ? [{ label: t('spacyLabel'), icon: Brain, desc: t('spacyDesc') }] : []),
    { label: t('browserLabel'), icon: Globe,  desc: t('browserDesc') },
  ]

  return (
    <div className='flex items-center gap-1.5 px-3 py-1.5 bg-muted/40 border-b text-xs'>
      <span className='text-muted-foreground font-medium mr-1 shrink-0'>{t('dataProcessing')}</span>
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
                <Badge variant='outline' className='ml-0.5 text-[9px] px-1 py-0 h-3.5'>{t('soon')}</Badge>
              </button>
            </TooltipTrigger>
            <TooltipContent side='bottom'><p>{opt.desc}</p></TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}
