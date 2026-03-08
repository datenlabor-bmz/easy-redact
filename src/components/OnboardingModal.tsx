'use client'

import { useState } from 'react'
import { Shield, Cloud, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { cloudAiEnabled } from '@/lib/config'
import type { ConsentMode } from '@/types'

interface OnboardingModalProps {
  open: boolean
  onAccept: (consent: ConsentMode) => void
}

export function OnboardingModal({ open, onAccept }: OnboardingModalProps) {
  const t = useTranslations('Onboarding')
  const [checked, setChecked] = useState(false)
  const [selectedMode, setSelectedMode] = useState<ConsentMode>(cloudAiEnabled ? 'cloud' : 'local')
  return (
    <Dialog open={open}>
      <DialogContent className='sm:max-w-xl' showCloseButton={false} onInteractOutside={e => e.preventDefault()}>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle className='flex items-center gap-2'>
              <Shield className='h-5 w-5 text-primary' />
              {t('title')}
            </DialogTitle>
            <LocaleSwitcher />
          </div>
          <DialogDescription>{t('subtitle')}</DialogDescription>
        </DialogHeader>

        <div className='flex flex-col gap-3 text-sm'>
          {/* Point 1: AI review responsibility */}
          <div className='flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30'>
            <AlertTriangle className='h-4 w-4 text-amber-600 shrink-0 mt-0.5' />
            <div>
              <p className='font-semibold text-amber-900 dark:text-amber-200'>{t('reviewTitle')}</p>
              <p className='text-muted-foreground mt-0.5 leading-relaxed'>{t('reviewDesc')}</p>
            </div>
          </div>

          {/* Point 2: Mode explanation + selection */}
          <div className='rounded-lg bg-muted/40 p-3 flex flex-col gap-2.5'>
            <p className='font-semibold'>{t('modesTitle')}</p>

            {cloudAiEnabled && (
              <button onClick={() => setSelectedMode('cloud')}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                  selectedMode === 'cloud' ? 'bg-blue-50/80 dark:bg-blue-950/30' : 'hover:bg-muted/50'
                }`}>
                <Cloud className='h-4 w-4 text-blue-500 shrink-0 mt-0.5' />
                <div>
                  <p className='font-medium text-foreground'>{t('cloudLabel')}</p>
                  <p className='text-muted-foreground text-xs mt-0.5 leading-relaxed'>{t('cloudDesc')}</p>
                </div>
              </button>
            )}

            <button onClick={() => setSelectedMode('local')}
              className={`flex items-start gap-2.5 p-2.5 rounded-lg text-left transition-colors ${
                selectedMode === 'local' ? 'bg-green-50/80 dark:bg-green-950/30' : 'hover:bg-muted/50'
              }`}>
              <Shield className='h-4 w-4 text-green-600 shrink-0 mt-0.5' />
              <div>
                <p className='font-medium text-foreground'>
                  {t('localLabel')}
                </p>
                <p className='text-muted-foreground text-xs mt-0.5 leading-relaxed'>{t('localDesc')}</p>
              </div>
            </button>

            {/* Illustration hint */}
            <p className='text-[11px] text-muted-foreground leading-relaxed mt-1'>
              {t('changeLater')}
            </p>
          </div>

          {/* Point 3: Classified documents warning */}
          {cloudAiEnabled && (
            <div className='flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30'>
              <Shield className='h-4 w-4 text-red-600 shrink-0 mt-0.5' />
              <div>
                <p className='font-semibold text-red-900 dark:text-red-200'>{t('classifiedTitle')}</p>
                <p className='text-muted-foreground mt-0.5 leading-relaxed'>{t('classifiedDesc')}</p>
              </div>
            </div>
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
