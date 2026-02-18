'use client'

import { Cloud, Server, X, Shield, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import type { ConsentMode } from '@/types'

interface ConsentModalProps {
  open: boolean
  reason: string
  onConsent: (mode: ConsentMode) => void
  onClose: () => void
}

export function ConsentModal({ open, reason, onConsent, onClose }: ConsentModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Lock className='h-5 w-5 text-amber-500' />
            Dokumentenzugriff bestätigen
          </DialogTitle>
          <DialogDescription>
            Der KI-Assistent möchte den Inhalt Ihrer Dokumente lesen, um Schwärzungsvorschläge zu machen.
          </DialogDescription>
        </DialogHeader>

        <div className='bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border-l-4 border-amber-400'>
          <p className='font-medium text-foreground mb-1'>Begründung des Assistenten:</p>
          <p>{reason}</p>
        </div>

        <p className='text-sm font-medium'>Wählen Sie, wie der Dokumentinhalt verarbeitet werden soll:</p>

        <div className='grid gap-3'>
          <button onClick={() => onConsent('cloud')}
            className='flex items-start gap-3 p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-left group'>
            <Cloud className='h-6 w-6 text-blue-500 mt-0.5 shrink-0' />
            <div>
              <p className='font-semibold text-sm group-hover:text-primary'>Cloud-KI (Azure OpenAI / gpt-5.2)</p>
              <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                Schnell und leistungsstark. Azure OpenAI ist DSGVO-konform und ISO 27001/27017/27018 zertifiziert.
                <strong className='text-foreground'> Kein Data Retention</strong> — Daten werden nicht gespeichert.
                Der US Cloud Act wurde bisher nie auf EU-Regierungskunden angewendet.
              </p>
            </div>
          </button>

          <button onClick={() => onConsent('local')}
            className='flex items-start gap-3 p-4 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all text-left group'>
            <Server className='h-6 w-6 text-green-500 mt-0.5 shrink-0' />
            <div>
              <p className='font-semibold text-sm group-hover:text-primary'>Lokales LLM (auf Ihrem Server)</p>
              <p className='text-xs text-muted-foreground mt-1 leading-relaxed'>
                Verarbeitung nur auf Ihrem eigenen GPU-Server. Keine Cloud-Verbindung für Dokumentinhalte.
                Erfordert eine konfigurierte lokale LLM-Instanz (z.B. Ollama).
              </p>
            </div>
          </button>
        </div>

        <div className='flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-lg p-3'>
          <Shield className='h-4 w-4 shrink-0' />
          <span>Ihre Dokumente werden <strong>nie dauerhaft gespeichert</strong> — weder auf unseren Servern noch bei OpenAI. Der Dokumentinhalt verlässt Ihr Gerät nur für den jeweiligen API-Aufruf.</span>
        </div>

        <Button variant='ghost' size='sm' onClick={onClose} className='self-end text-muted-foreground'>
          <X className='h-4 w-4 mr-1' /> Ablehnen
        </Button>
      </DialogContent>
    </Dialog>
  )
}
