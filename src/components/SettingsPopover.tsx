'use client'

import { useEffect, useState } from 'react'
import { Cloud, Server, Brain, Globe, Lock, ShieldCheck, FileSearch, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getJurisdictions } from '@/lib/redaction-rules'
import type { ConsentMode, JurisdictionMeta, RedactionMode, Session } from '@/types'

// ── Shared option lists ────────────────────────────────────────────────────────

const CONSENT_OPTIONS: Array<{ mode: ConsentMode; label: string; icon: React.ElementType; desc: string; available: boolean }> = [
  { mode: null,    label: 'Nicht freigegeben', icon: Lock,   desc: 'Kein Dokumentinhalt wird an externe Dienste übertragen',                                  available: true },
  { mode: 'cloud', label: 'Cloud-KI',          icon: Cloud,  desc: 'Azure OpenAI — DSGVO-konform, kein Data Retention, kein Training auf Ihren Daten',         available: true },
  { mode: 'local', label: 'Lokales LLM',        icon: Server, desc: 'Ollama-kompatibler Endpunkt auf Ihrem eigenen GPU-Server — keine externe Datenübertragung', available: true },
  { mode: null,    label: 'spaCy NLP',          icon: Brain,  desc: 'Lokale NLP-Analyse ohne KI-Modell (Docker only)',                                          available: false },
  { mode: null,    label: 'Browser NLP',        icon: Globe,  desc: 'In-Browser Transformer — vollständig offline (in Entwicklung)',                             available: false },
]

const REDACTION_MODES: Array<{ mode: RedactionMode; label: string; icon: React.ElementType; desc: string }> = [
  { mode: 'pii', label: 'Personendaten (PII)',        icon: User,       desc: 'Schwärzt Namen, Adressen, Kontaktdaten und andere personenbezogene Daten' },
  { mode: 'foi', label: 'Informationsfreiheit (FOI)', icon: FileSearch, desc: 'Schwärzt nach den Ausnahmetatbeständen des jeweiligen Informationsfreiheitsgesetzes' },
]

// ── Shared option button list ──────────────────────────────────────────────────

function OptionList<T>({ options, isActive, onSelect }: {
  options: Array<{ value: T; label: string; icon: React.ElementType; desc: string; available?: boolean }>
  isActive: (v: T) => boolean
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
                  ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                  ${isActive(opt.value) ? 'bg-primary text-primary-foreground' : available ? 'hover:bg-muted text-foreground' : 'text-muted-foreground'}`}>
                <Icon className='h-3.5 w-3.5 shrink-0' />
                <span className='flex-1'>{opt.label}</span>
                {!available && <span className='text-[9px] border rounded px-1 opacity-60'>bald</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side='left' className='max-w-52'>{opt.desc}</TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

// ── Datenverarbeitung popover ──────────────────────────────────────────────────

interface ConsentPopoverProps {
  session: Session
  onConsentChange: (mode: ConsentMode) => void
  onModelSettingsChange: (key: keyof Session['modelSettings'], value: string) => void
}

export function ConsentPopover({ session, onConsentChange, onModelSettingsChange }: ConsentPopoverProps) {
  const [open, setOpen] = useState(false)
  const [showModelFields, setShowModelFields] = useState(false)

  const active = CONSENT_OPTIONS.find(o => o.available && (
    o.mode === session.consent && (o.mode !== null || o.label === 'Nicht freigegeben')
  )) ?? CONSENT_OPTIONS[0]
  const ActiveIcon = active.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-foreground'>
          <ActiveIcon className='h-3.5 w-3.5' />
          <span>{active.label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-68 p-0' onOpenAutoFocus={e => e.preventDefault()}>
        <TooltipProvider delayDuration={400} disableHoverableContent>
          <div className='px-3 pt-3 pb-1'>
            <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2'>Datenverarbeitung</p>
            <OptionList
              options={CONSENT_OPTIONS.map(o => ({ value: o.mode, label: o.label, icon: o.icon, desc: o.desc, available: o.available }))}
              isActive={v => v === session.consent && (v !== null || active.label === 'Nicht freigegeben')}
              onSelect={onConsentChange} />
          </div>

          {(session.consent === 'cloud' || session.consent === 'local') && (
            <div className='px-3 pb-2'>
              <button tabIndex={-1} onClick={() => setShowModelFields(v => !v)}
                className='mt-1 text-[10px] text-muted-foreground hover:text-foreground w-full text-left flex items-center gap-1'>
                <span>{showModelFields ? '▾' : '▸'}</span> Modell-Einstellungen
              </button>
              {showModelFields && session.consent === 'cloud' && (
                <div className='mt-1.5'>
                  <label className='text-[10px] text-muted-foreground block mb-0.5'>Azure Deployment</label>
                  <input className='w-full text-xs border rounded px-2 py-1 bg-background'
                    value={session.modelSettings.cloudDeployment}
                    onChange={e => onModelSettingsChange('cloudDeployment', e.target.value)} />
                </div>
              )}
              {showModelFields && session.consent === 'local' && (
                <div className='mt-1.5 flex flex-col gap-1.5'>
                  <div>
                    <label className='text-[10px] text-muted-foreground block mb-0.5'>API Base URL</label>
                    <input className='w-full text-xs border rounded px-2 py-1 bg-background'
                      value={session.modelSettings.localBase}
                      onChange={e => onModelSettingsChange('localBase', e.target.value)} />
                  </div>
                  <div>
                    <label className='text-[10px] text-muted-foreground block mb-0.5'>Modell</label>
                    <input className='w-full text-xs border rounded px-2 py-1 bg-background'
                      value={session.modelSettings.localModel}
                      onChange={e => onModelSettingsChange('localModel', e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          )}

          {session.consent === 'cloud' && (
            <>
              <Separator />
              <div className='px-3 py-2 flex items-start gap-1.5'>
                <ShieldCheck className='h-3 w-3 text-green-600 mt-0.5 shrink-0' />
                <p className='text-[10px] text-muted-foreground leading-relaxed'>
                  Azure OpenAI ist DSGVO-konform zertifiziert. Keine Datenspeicherung, kein Modelltraining mit Ihren Daten.
                </p>
              </div>
            </>
          )}
        </TooltipProvider>
      </PopoverContent>
    </Popover>
  )
}

// ── Schwärzungsmodus popover ───────────────────────────────────────────────────

interface RedactionModePopoverProps {
  session: Session
  onRedactionModeChange: (mode: RedactionMode) => void
  onFoiJurisdictionChange: (id: string) => void
}

export function RedactionModePopover({ session, onRedactionModeChange, onFoiJurisdictionChange }: RedactionModePopoverProps) {
  const [open, setOpen] = useState(false)
  const [jurisdictions, setJurisdictions] = useState<JurisdictionMeta[]>([])

  useEffect(() => {
    if (session.redactionMode === 'foi' && !jurisdictions.length)
      getJurisdictions().then(setJurisdictions).catch(() => {})
  }, [session.redactionMode, jurisdictions.length])

  const active = REDACTION_MODES.find(m => m.mode === session.redactionMode) ?? REDACTION_MODES[0]
  const ActiveIcon = active.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant='ghost' size='sm' className='gap-1.5 h-7 px-2 text-xs text-muted-foreground hover:text-foreground'>
          <ActiveIcon className='h-3.5 w-3.5' />
          <span>{active.label}</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-64 p-0' onOpenAutoFocus={e => e.preventDefault()}>
        <TooltipProvider delayDuration={400} disableHoverableContent>
          <div className='p-3'>
            <p className='text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2'>Schwärzungsmodus</p>
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
                <label className='text-[10px] text-muted-foreground block mb-1'>Rechtsgrundlage</label>
                <Select value={session.foiJurisdiction ?? ''} onValueChange={onFoiJurisdictionChange}>
                  <SelectTrigger className='h-7 text-xs'>
                    <SelectValue placeholder={jurisdictions.length ? 'Gesetz wählen…' : 'Lädt…'} />
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

// ── Legacy combined export (keep for any existing import) ─────────────────────

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
