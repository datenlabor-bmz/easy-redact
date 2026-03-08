'use client'

import { Cloud, Shield } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'
import { cloudAiEnabled, localBackend } from '@/lib/config'
import type { ConsentMode } from '@/types'

interface ModeSelectorProps {
  consent: ConsentMode
  onConsentChange: (mode: ConsentMode) => void
}

export function ModeSelector({ consent, onConsentChange }: ModeSelectorProps) {
  const t = useTranslations('ModeSelector')

  const localDesc = localBackend === 'browser' ? t('localBrowserDesc')
    : localBackend === 'llm' ? t('localLlmDesc')
    : t('localSpacyDesc')

  if (!cloudAiEnabled) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='flex items-center gap-1.5 px-2 text-xs text-muted-foreground'>
            <Shield className='h-3.5 w-3.5 text-green-600' />
            <span className='font-medium text-foreground'>{t('localLabel')}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='max-w-52 text-center'>{localDesc}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className='flex h-7 rounded-md border bg-muted/50 p-0.5'>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onConsentChange('cloud')}
            className={`flex items-center gap-1.5 px-2.5 rounded text-xs whitespace-nowrap transition-colors ${
              consent === 'cloud'
                ? 'bg-background shadow-sm text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Cloud className='h-3 w-3 shrink-0 text-blue-500' />
            <span className='hidden @[20rem]:inline'>{t('cloudLabel')}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='max-w-52 text-center'><strong>{t('cloudLabel')}</strong> — {t('cloudDesc')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => onConsentChange('local')}
            className={`flex items-center gap-1.5 px-2.5 rounded text-xs whitespace-nowrap transition-colors ${
              consent === 'local'
                ? 'bg-background shadow-sm text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Shield className='h-3 w-3 shrink-0 text-green-600' />
            <span className='hidden @[20rem]:inline'>{t('localLabel')}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='max-w-52 text-center'><strong>{t('localLabel')}</strong> — {localDesc}</TooltipContent>
      </Tooltip>
    </div>
  )
}
