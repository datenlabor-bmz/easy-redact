'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'

interface RedactConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function RedactConfirmDialog({ open, onConfirm, onCancel }: RedactConfirmDialogProps) {
  const t = useTranslations('RedactConfirm')

  return (
    <Dialog open={open} onOpenChange={o => !o && onCancel()}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <div className='space-y-2 text-sm text-muted-foreground'>
          <p>{t('detail')}</p>
          <p>{t('description')}</p>
        </div>
        <div className='flex flex-col gap-2 pt-1'>
          <Button variant='outline' onClick={onCancel}>{t('cancel')}</Button>
          <Button onClick={onConfirm}>{t('confirm')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
