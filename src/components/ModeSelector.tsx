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
  const isBrowserComingSoon = localBackend === 'browser'
  const localTooltip = isBrowserComingSoon ? `${localDesc} (${t('comingSoon')})` : localDesc

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
            className={`flex items-center gap-1.5 px-2.5 rounded text-xs transition-colors ${
              consent === 'cloud'
                ? 'bg-background shadow-sm text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Cloud className='h-3 w-3 text-blue-500' />
            {t('cloudLabel')}
          </button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='max-w-52 text-center'>{t('cloudDesc')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button onClick={() => !isBrowserComingSoon && onConsentChange('local')}
            disabled={isBrowserComingSoon}
            className={`flex items-center gap-1.5 px-2.5 rounded text-xs transition-colors ${
              isBrowserComingSoon ? 'text-muted-foreground/40 cursor-not-allowed' :
              consent === 'local'
                ? 'bg-background shadow-sm text-foreground font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}>
            <Shield className='h-3 w-3 text-green-600' />
            {t('localLabel')}
          </button>
        </TooltipTrigger>
        <TooltipContent side='bottom' className='max-w-52 text-center'>{localTooltip}</TooltipContent>
      </Tooltip>
    </div>
  )
}
