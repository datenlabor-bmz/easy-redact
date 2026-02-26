'use client'

import { useState } from 'react'
import { Shield, Cloud, Server, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

interface OnboardingModalProps {
  open: boolean
  onAccept: () => void
}

export function OnboardingModal({ open, onAccept }: OnboardingModalProps) {
  const t = useTranslations('Onboarding')
  const [checked, setChecked] = useState(false)

  return (
    <Dialog open={open}>
      <DialogContent className='sm:max-w-lg' showCloseButton={false} onInteractOutside={e => e.preventDefault()}>
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
          <div className='flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'>
            <AlertTriangle className='h-4 w-4 text-amber-600 shrink-0 mt-0.5' />
            <div>
              <p className='font-semibold text-amber-900 dark:text-amber-200'>{t('reviewTitle')}</p>
              <p className='text-muted-foreground mt-0.5 leading-relaxed'>{t('reviewDesc')}</p>
            </div>
          </div>

          {/* Point 2: Processing modes */}
          <div className='rounded-lg border p-3 flex flex-col gap-2'>
            <p className='font-semibold'>{t('modesTitle')}</p>
            <div className='flex items-start gap-2'>
              <Cloud className='h-4 w-4 text-blue-500 shrink-0 mt-0.5' />
              <p className='text-muted-foreground leading-relaxed'><span className='font-medium text-foreground'>{t('cloudLabel')}: </span>{t('cloudDesc')}</p>
            </div>
            <div className='flex items-start gap-2'>
              <Server className='h-4 w-4 text-green-600 shrink-0 mt-0.5' />
              <p className='text-muted-foreground leading-relaxed'><span className='font-medium text-foreground'>{t('localLabel')}: </span>{t('localDesc')}</p>
            </div>
          </div>

          {/* Point 3: Classified documents */}
          <div className='flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'>
            <Shield className='h-4 w-4 text-red-600 shrink-0 mt-0.5' />
            <div>
              <p className='font-semibold text-red-900 dark:text-red-200'>{t('classifiedTitle')}</p>
              <p className='text-muted-foreground mt-0.5 leading-relaxed'>{t('classifiedDesc')}</p>
            </div>
          </div>
        </div>

        {/* Checkbox acknowledgement */}
        <label className='flex items-start gap-3 cursor-pointer select-none mt-1 group'>
          <input
            type='checkbox'
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
            className='mt-0.5 h-4 w-4 rounded border-border accent-primary cursor-pointer shrink-0'
          />
          <span className='text-sm leading-relaxed text-muted-foreground group-hover:text-foreground transition-colors'>
            {t('acknowledgement')}
          </span>
        </label>

        <Button onClick={onAccept} disabled={!checked} className='w-full'>
          {t('proceed')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
