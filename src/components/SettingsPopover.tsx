'use client'

import { useEffect, useState } from 'react'
import { Cloud, Server, Brain, Globe, Hand, ShieldCheck, FileSearch, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from 'next-intl'
import { getJurisdictions } from '@/lib/redaction-rules'
import type { ConsentMode, JurisdictionMeta, RedactionMode, Session } from '@/types'

const localLlmEnabled = process.env.NEXT_PUBLIC_LOCAL_LLM_ENABLED === 'true'
const spacyEnabled = process.env.NEXT_PUBLIC_SPACY_ENABLED === 'true'

function OptionList<T>({ options, isActive, onSelect }: {
  options: Array<{ value: T; label: string; icon: React.ElementType; desc: string; available?: boolean; comingSoon?: string }>
  isActive: (v: T, i: number) => boolean
  onSelect: (v: T) => void
}) {
  return (
    <div className='flex flex-col gap-0.5'>
      {options.map((opt, i) => {
        const Icon = opt.icon
        const available = opt.available !== false
        return (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <button tabIndex={-1} disabled={!available} onClick={() => available && onSelect(opt.value)}
                className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left w-full
                  ${!available ? 'cursor-not-allowed text-muted-foreground/50' : 'cursor-pointer'}
                  ${isActive(opt.value, i) ? 'bg-primary text-primary-foreground' : available ? 'hover:bg-muted text-foreground' : ''}`}>
                <Icon className='h-3.5 w-3.5 shrink-0' />
                <span className='flex-1'>{opt.label}</span>
                {!available && <span className='text-[9px] text-muted-foreground/40 font-normal'>{opt.comingSoon}</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side='left' className='max-w-52'>{opt.desc}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

const ICON_FOR_MODE: Record<string, React.ElementType> = {
  cloud: Cloud, local: Server, spacy: Brain, browser: Globe,
}

// ── Consent popover ────────────────────────────────────────────────────────────

interface ConsentPopoverProps {
  session: Session
  onConsentChange: (mode: ConsentMode) => void
  onModelSettingsChange: (key: keyof Session['modelSettings'], value: string) => void
}

export function ConsentPopover({ session, onConsentChange, onModelSettingsChange }: ConsentPopoverProps) {
  const t = useTranslations('SettingsPopover')
  const [open, setOpen] = useState(false)
  const [showModelFields, setShowModelFields] = useState(false)

  const CHAT_OPTIONS = [
    { mode: 'cloud' as ConsentMode, label: t('cloudLabel'),  icon: Cloud,  desc: t('cloudDesc'),   available: true },
    { mode: 'local' as ConsentMode, label: t('localLabel'),  icon: Server, desc: t('localDesc'),   available: localLlmEnabled },
  ]

  const RULE_OPTIONS = [
    { mode: 'spacy' as ConsentMode,   label: t('spacyLabel'),   icon: Brain, desc: t('spacyDesc'),   available: spacyEnabled },
    { mode: null as ConsentMode,       label: t('browserLabel'), icon: Globe, desc: t('browserDesc'), available: false },
  ]

  const activeIcon = session.consent ? ICON_FOR_MODE[session.consent] ?? Hand : Hand
  const ActiveIcon = activeIcon
  const activeLabel = session.consent
    ? [...CHAT_OPTIONS, ...RULE_OPTIONS].find(o => o.mode === session.consent)?.label ?? t('manualOnly')
    : t('manualOnly')

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 h-7 px-2 has-[>svg]:px-2 text-xs text-muted-foreground hover:text-foreground'>
          <ActiveIcon className='h-3.5 w-3.5' />
          <span>{activeLabel}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-64 p-0' onOpenAutoFocus={e => e.preventDefault()}>
        <TooltipProvider delayDuration={400} disableHoverableContent>
          <div className='px-3 pt-3 pb-0'>
            <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wide'>{t('dataProcessing')}</p>
          </div>
          {/* Manual */}
          <div className='px-3 pt-1.5 pb-1'>
            <OptionList
              options={[{ value: null as ConsentMode, label: t('manualOnly'), icon: Hand, desc: t('manualOnlyDesc') }]}
              isActive={v => session.consent === null}
              onSelect={onConsentChange} />
          </div>

          <Separator />

          {/* Chat AI section */}
          <div className='px-3 pb-1'>
            <p className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 mt-2'>{t('chatSection')}</p>
            <OptionList
              options={CHAT_OPTIONS.map(o => ({ value: o.mode, label: o.label, icon: o.icon, desc: o.desc, available: o.available, comingSoon: t('comingSoon') }))}
              isActive={v => v === session.consent}
              onSelect={onConsentChange} />
          </div>

          {/* Model settings */}
          {(session.consent === 'cloud' || session.consent === 'local') && (
            <div className='px-3 pb-2'>
              <button tabIndex={-1} onClick={() => setShowModelFields(v => !v)}
                className='mt-1 text-[10px] text-muted-foreground hover:text-foreground w-full text-left flex items-center gap-1'>
                <span>{showModelFields ? '▾' : '▸'}</span> {t('modelSettings')}
              </button>
              {showModelFields && session.consent === 'cloud' && (
                <div className='mt-1.5'>
                  <label className='text-[10px] text-muted-foreground block mb-0.5'>{t('azureDeployment')}</label>
                  <input className='w-full text-xs border rounded px-2 py-1 bg-background'
                    value={session.modelSettings.cloudDeployment}
                    onChange={e => onModelSettingsChange('cloudDeployment', e.target.value)} />
                </div>
              )}
              {showModelFields && session.consent === 'local' && (
                <div className='mt-1.5 flex flex-col gap-1.5'>
                  <div>
                    <label className='text-[10px] text-muted-foreground block mb-0.5'>{t('apiBaseUrl')}</label>
                    <input className='w-full text-xs border rounded px-2 py-1 bg-background'
                      value={session.modelSettings.localBase}
                      onChange={e => onModelSettingsChange('localBase', e.target.value)} />
                  </div>
                  <div>
                    <label className='text-[10px] text-muted-foreground block mb-0.5'>{t('model')}</label>
                    <input className='w-full text-xs border rounded px-2 py-1 bg-background'
                      value={session.modelSettings.localModel}
                      onChange={e => onModelSettingsChange('localModel', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator />

          {/* Rule-based section */}
          <div className='px-3 pt-2 pb-2'>
            <p className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5'>{t('ruleSection')}</p>
            <OptionList
              options={RULE_OPTIONS.map(o => ({ value: o.mode, label: o.label, icon: o.icon, desc: o.desc, available: o.available, comingSoon: t('comingSoon') }))}
              isActive={v => v === session.consent}
              onSelect={onConsentChange} />
          </div>

          {session.consent === 'cloud' && (
            <>
              <Separator />
              <div className='px-3 py-2 flex items-start gap-1.5'>
                <ShieldCheck className='h-3 w-3 text-green-600 mt-0.5 shrink-0' />
                <p className='text-[10px] text-muted-foreground leading-relaxed'>
                  {t('gdprNote')}
                </p>
              </div>
            </>
          )}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  )
}

// ── Redaction mode popover ─────────────────────────────────────────────────────

interface RedactionModePopoverProps {
  session: Session
  onRedactionModeChange: (mode: RedactionMode) => void
  onFoiJurisdictionChange: (id: string) => void
}

export function RedactionModePopover({ session, onRedactionModeChange, onFoiJurisdictionChange }: RedactionModePopoverProps) {
  const t = useTranslations('SettingsPopover')
  const [open, setOpen] = useState(false)
  const [jurisdictions, setJurisdictions] = useState<JurisdictionMeta[]>([])

  useEffect(() => {
    if (session.redactionMode === 'foi' && !jurisdictions.length)
      getJurisdictions().then(setJurisdictions).catch(() => {})
  }, [session.redactionMode, jurisdictions.length])

  const REDACTION_MODES = [
    { mode: 'pii' as RedactionMode, label: t('piiLabel'), icon: User,       desc: t('piiDesc') },
    { mode: 'foi' as RedactionMode, label: t('foiLabel'), icon: FileSearch, desc: t('foiDesc') },
  ]

  const active = REDACTION_MODES.find(m => m.mode === session.redactionMode) ?? REDACTION_MODES[0]
  const ActiveIcon = active.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 h-7 px-2 has-[>svg]:px-2 text-xs text-muted-foreground hover:text-foreground'>
          <ActiveIcon className='h-3.5 w-3.5' />
          <span>{active.label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-64 p-0' onOpenAutoFocus={e => e.preventDefault()}>
        <TooltipProvider delayDuration={400} disableHoverableContent>
          <div className='p-3'>
            <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2'>{t('redactionMode')}</p>
            <OptionList
              options={REDACTION_MODES.map(m => ({ value: m.mode, label: m.label, icon: m.icon, desc: m.desc }))}
              isActive={v => v === session.redactionMode}
              onSelect={mode => {
                onRedactionModeChange(mode)
                if (mode === 'foi' && !jurisdictions.length)
                  getJurisdictions().then(setJurisdictions).catch(() => {})
              }} />

            {session.redactionMode === 'foi' && (
              <div className='mt-2'>
                <label className='text-[10px] text-muted-foreground block mb-1'>{t('jurisdiction')}</label>
                <Select value={session.foiJurisdiction ?? ''} onValueChange={onFoiJurisdictionChange}>
                  <SelectTrigger className='h-7 text-xs w-full'>
                    <SelectValue placeholder={jurisdictions.length ? t('chooseJurisdiction') : t('loading')} />
                  </SelectTrigger>
                  <SelectContent>
                    {jurisdictions.map(j => (
                      <SelectItem key={j.id} value={j.id} className='text-xs'>
                        {j.jurisdiction_name} — {j.abbreviation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  )
}

// ── Combined export ────────────────────────────────────────────────────────────

interface SettingsPopoverProps {
  session: Session
  onConsentChange: (mode: ConsentMode) => void
  onRedactionModeChange: (mode: RedactionMode) => void
  onFoiJurisdictionChange: (id: string) => void
  onModelSettingsChange: (key: keyof Session['modelSettings'], value: string) => void
}

export function SettingsPopover({ session, onConsentChange, onRedactionModeChange, onFoiJurisdictionChange, onModelSettingsChange }: SettingsPopoverProps) {
  return (
    <>
      <ConsentPopover session={session} onConsentChange={onConsentChange} onModelSettingsChange={onModelSettingsChange} />
      <RedactionModePopover session={session} onRedactionModeChange={onRedactionModeChange} onFoiJurisdictionChange={onFoiJurisdictionChange} />
    </>
  )
}
