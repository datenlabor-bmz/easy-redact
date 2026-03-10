'use client'

import { useState } from 'react'
import { Shield, Cloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { cloudAiEnabled } from '@/lib/config'
import type { AiMode } from '@/types'

interface OnboardingModalProps {
  open: boolean
  onAccept: (aiMode: AiMode) => void
}

export function OnboardingModal({ open, onAccept }: OnboardingModalProps) {
  const t = useTranslations('Onboarding')
  const [checked, setChecked] = useState(false)
  const [selectedMode, setSelectedMode] = useState<AiMode>(cloudAiEnabled ? 'cloud' : 'local')
  return (
    <Dialog open={open}>
      <DialogContent className='sm:max-w-xl' showCloseButton={false} onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>{t('title')}</DialogTitle>
            <LocaleSwitcher />
          </div>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-4 text-sm'>
          <p className='text-muted-foreground leading-relaxed'>
            <span className='font-medium text-foreground'>{t('reviewTitle')} </span>
            {t('reviewDesc')}
          </p>

          <div className='flex flex-col gap-1'>
            <p className='font-medium mb-1'>{t('modesTitle')}</p>

            {cloudAiEnabled && (
              <button onClick={() => setSelectedMode('cloud')}
                className={`flex items-start gap-2.5 p-2.5 rounded-md text-left transition-colors border ${
                  selectedMode === 'cloud' ? 'border-border bg-muted/50' : 'border-transparent hover:bg-muted/30'
                }`}>
                <Cloud className='h-4 w-4 text-blue-500 shrink-0 mt-0.5' />
                <div>
                  <p className='font-medium text-foreground'>{t('cloudLabel')}</p>
                  <p className='text-muted-foreground text-xs mt-0.5 leading-relaxed'>{t('cloudDesc')}</p>
                </div>
              </button>
            )}

            <button onClick={() => setSelectedMode('local')}
              className={`flex items-start gap-2.5 p-2.5 rounded-md text-left transition-colors border ${
                selectedMode === 'local' ? 'border-border bg-muted/50' : 'border-transparent hover:bg-muted/30'
              }`}>
              <Shield className='h-4 w-4 text-green-600 shrink-0 mt-0.5' />
              <div>
                <p className='font-medium text-foreground'>{t('localLabel')}</p>
                <p className='text-muted-foreground text-xs mt-0.5 leading-relaxed'>{t('localDesc')}</p>
              </div>
            </button>

            <div className='flex items-center gap-2 mt-1'>
              <p className='text-muted-foreground'>{t('changeLater')}</p>
              <div className='flex h-6 rounded border border-border bg-muted/50 p-0.5 shrink-0 pointer-events-none'>
                <div className='flex items-center px-2 rounded bg-background shadow-sm'>
                  <Cloud className='h-3 w-3 text-blue-500' />
                </div>
                <div className='flex items-center px-2 rounded'>
                  <Shield className='h-3 w-3 text-green-600' />
                </div>
              </div>
            </div>
          </div>

          {cloudAiEnabled && (
            <p className='text-muted-foreground leading-relaxed'>
              <span className='font-medium text-foreground'>{t('classifiedTitle')} </span>
              {t('classifiedDesc')}
            </p>
          )}
        </div>

        <label className='flex items-start gap-3 cursor-pointer select-none mt-1 group'>
          <input type='checkbox' checked={checked} onChange={e => setChecked(e.target.checked)}
            className='mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0' />
          <span className='text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors'>
            {t('acknowledgement')}
          </span>
        </label>

        <Button onClick={() => onAccept(selectedMode)} disabled={!checked} className='w-full'>
          {t('proceed')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
