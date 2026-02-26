'use client'

import { Check } from 'lucide-react'
import { useTranslations } from 'next-intl'

const FIELD_KEYS = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer', 'CreationDate', 'ModDate'] as const
type FieldKey = typeof FIELD_KEYS[number]

export function MetadataPanel({ metadata, fieldsToRemove, onChange }: {
  metadata: Record<string, string>
  fieldsToRemove: Set<string>
  onChange: (fields: Set<string>) => void
}) {
  const t = useTranslations('MetadataPanel')
  const keys = Object.keys(metadata)
  if (!keys.length) return null

  const toggle = (key: string) => {
    const next = new Set(fieldsToRemove)
    next.has(key) ? next.delete(key) : next.add(key)
    onChange(next)
  }

  return (
    <div className='w-full max-w-[var(--page-width,700px)] mx-auto my-3 px-2'>
      <div className='rounded-lg border border-border bg-card overflow-hidden'>
        <div className='px-3 py-2 border-b border-border'>
          <span className='text-xs font-semibold text-muted-foreground'>{t('heading')}</span>
        </div>
        <div className='divide-y divide-border'>
          {keys.map(k => {
            const removing = fieldsToRemove.has(k)
            const label = FIELD_KEYS.includes(k as FieldKey) ? t(k as FieldKey) : k
            return (
              <div key={k} className='flex items-center gap-3 px-3 py-1.5'>
                <span className='text-[11px] text-muted-foreground w-24 shrink-0'>{label}</span>
                <span className='text-[11px] font-mono flex-1 truncate'>
                  {removing
                    ? <span style={{ background: 'rgba(0,0,0,0.45)', padding: '1px 4px' }}>{metadata[k]}</span>
                    : metadata[k]
                  }
                </span>
                <button onClick={() => toggle(k)}
                  className='flex items-center gap-1.5 shrink-0 cursor-pointer group'>
                  <span className='text-[10px] text-muted-foreground group-hover:text-foreground transition-colors'>{t('remove')}</span>
                  <div className={`w-3.5 h-3.5 rounded shrink-0 border flex items-center justify-center transition-colors ${removing ? 'bg-foreground border-foreground' : 'border-muted-foreground/40 bg-transparent'}`}>
                    {removing && <Check className='h-2.5 w-2.5 text-background' strokeWidth={3} />}
                  </div>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
