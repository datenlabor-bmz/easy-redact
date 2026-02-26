'use client'

import { useState } from 'react'
import { Globe, Check } from 'lucide-react'
import { useLocale } from 'next-intl'
import { useRouter, usePathname } from '@/lib/navigation'
import { routing } from '@/i18n/routing'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const LANGUAGES: Record<string, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
  ar: 'العربية',
  zh: '中文',
}

export function LocaleSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 h-7 px-2 has-[>svg]:px-2 text-xs text-muted-foreground hover:text-foreground'>
          <Globe className='h-3.5 w-3.5' />
          <span>{LANGUAGES[locale]}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align='end' className='w-36 p-1' onOpenAutoFocus={e => e.preventDefault()}>
        {routing.locales.map(l => (
          <button key={l}
            onClick={() => { router.replace(pathname, { locale: l }); setOpen(false) }}
            className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors text-left
              ${l === locale ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}>
            {LANGUAGES[l]}
            {l === locale && <Check className='h-3 w-3 shrink-0' />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}
