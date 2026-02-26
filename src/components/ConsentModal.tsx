'use client'

import { Cloud, Server, X, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'
import type { ConsentMode } from '@/types'

interface ConsentModalProps {
  open: boolean
  reason: string
  onConsent: (mode: ConsentMode) => void
  onClose: () => void
}

export function ConsentModal({ open, reason, onConsent, onClose }: ConsentModalProps) {
  const t = useTranslations('ConsentModal')
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Lock className='h-5 w-5 text-amber-500' />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className='bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border-l-4 border-amber-400'>
          <p className='font-medium text-foreground mb-1'>{t('reasoning')}</p>
          <p>{reason}</p>
        </div>

        <p className='text-sm font-medium'>{t('choose')}</p>

        <div className='grid gap-3'>
          <button onClick={() => onConsent('cloud')}
            className='flex items-start gap-3 p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-left group'>
            <Cloud className='h-6 w-6 text-blue-500 mt-0.5 shrink-0' />
            <div>
              <p className='font-semibold text-sm group-hover:text-primary'>{t('cloudLabel')}</p>
              <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                {t('cloudDesc')}
                <strong className='text-foreground'> {t('cloudDescStrong')}</strong>
                {' '}{t('cloudDescSuffix')}
              </p>
            </div>
          </button>

          <button onClick={() => onConsent('local')}
            className='flex items-start gap-3 p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-left group'>
            <Server className='h-6 w-6 text-green-500 mt-0.5 shrink-0' />
            <div>
              <p className='font-semibold text-sm group-hover:text-primary'>{t('localLabel')}</p>
              <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                {t('localDesc')}
              </p>
            </div>
          </button>
        </div>

        <div className='flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3'>
          <Shield className='h-4 w-4 shrink-0' />
          <span>
            {t.rich('privacyNote', {
              strong: () => <strong>{t('privacyStrong')}</strong>,
            })}
          </span>
        </div>

        <Button variant='ghost' size='sm' onClick={onClose} className='self-end text-muted-foreground'>
          <X className='h-4 w-4 mr-1' /> {t('reject')}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
