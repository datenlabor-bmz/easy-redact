'use client'

import { useEffect, useState } from 'react'
import { FileSearch, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useTranslations } from 'next-intl'
import { getJurisdictions } from '@/lib/redaction-rules'
import type { JurisdictionMeta, RedactionMode } from '@/types'

interface FoiSelectorProps {
  redactionMode: RedactionMode
  foiJurisdiction?: string
  onRedactionModeChange: (mode: RedactionMode) => void
  onFoiJurisdictionChange: (id: string) => void
}

export function FoiSelector({ redactionMode, foiJurisdiction, onRedactionModeChange, onFoiJurisdictionChange }: FoiSelectorProps) {
  const t = useTranslations('FoiSelector')
  const [open, setOpen] = useState(false)
  const [jurisdictions, setJurisdictions] = useState<JurisdictionMeta[]>([])

  useEffect(() => {
    if (open && !jurisdictions.length)
      getJurisdictions().then(setJurisdictions).catch(() => {})
  }, [open, jurisdictions.length])

  const activeLabel = redactionMode === 'foi' && foiJurisdiction
    ? jurisdictions.find(j => j.id === foiJurisdiction)?.abbreviation ?? t('label')
    : t('label')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 h-7 px-2 has-[>svg]:px-2 text-xs text-muted-foreground hover:text-foreground'>
          <FileSearch className='h-3.5 w-3.5' />
          <span>{activeLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-56 p-1' onOpenAutoFocus={e => e.preventDefault()}>
        <button
          onClick={() => { onRedactionModeChange('pii'); setOpen(false) }}
          className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors text-left
            ${redactionMode === 'pii' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
          {t('noFoi')}
          {redactionMode === 'pii' && <Check className='h-3 w-3 shrink-0' />}
        </button>
        {jurisdictions.map(j => {
          const active = redactionMode === 'foi' && foiJurisdiction === j.id
          return (
            <button key={j.id}
              onClick={() => { onRedactionModeChange('foi'); onFoiJurisdictionChange(j.id); setOpen(false) }}
              className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors text-left
                ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
              {j.jurisdiction_name} — {j.abbreviation}
              {active && <Check className='h-3 w-3 shrink-0' />}
            </button>
          )
        })}
        {!jurisdictions.length && (
          <div className='px-2.5 py-1.5 text-xs text-muted-foreground'>{t('loading')}</div>
        )}
      </PopoverContent>
    </Popover>
  )
}
