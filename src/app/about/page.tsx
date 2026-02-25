import Link from 'next/link'
import { Bot, Download, ArrowRight, Check, X, ChevronDown } from 'lucide-react'

// ── Mini UI mockups ────────────────────────────────────────────────────────────

function MockChat() {
  return (
    <div className='flex flex-col gap-2 p-3 text-[11px]'>
      <div className='flex gap-2 items-start'>
        <div className='w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5'>
          <Bot className='h-2.5 w-2.5 text-muted-foreground' />
        </div>
        <div className='bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-foreground max-w-[80%]'>
          Ich habe das Dokument gelesen. Soll ich Schwärzungsvorschläge erstellen?
        </div>
      </div>
      <div className='flex gap-2 items-start justify-end'>
        <div className='bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2'>
          Ja, Vorschläge erstellen
        </div>
      </div>
      <div className='flex gap-2 items-start'>
        <div className='w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5'>
          <Bot className='h-2.5 w-2.5 text-muted-foreground' />
        </div>
        <div className='flex flex-col gap-1'>
          <div className='text-[10px] text-muted-foreground'>✓ Dokumente gelesen</div>
          <div className='text-[10px] text-muted-foreground'>✓ 11 Schwärzungen vorgeschlagen</div>
          <div className='bg-muted rounded-2xl rounded-tl-sm px-3 py-2 text-foreground max-w-[80%]'>
            Ich habe 11 Schwärzungen vorgeschlagen — personenbezogene Daten von 4 Privatpersonen.
          </div>
        </div>
      </div>
    </div>
  )
}

function MockRedactions() {
  const items = [
    { text: 'Thomas Berger', color: 'rgba(0,0,0,0.45)', suggested: false },
    { text: 'maria@example.de', color: 'rgba(253,224,71,0.5)', suggested: true },
    { text: 'Lena Hoffmann', color: 'rgba(0,0,0,0.45)', suggested: false },
    { text: '+49 30 12345678', color: 'rgba(253,224,71,0.25)', suggested: true, low: true },
  ]
  return (
    <div className='flex flex-col text-[11px]'>
      <div className='px-3 py-1.5 text-[10px] font-semibold text-muted-foreground bg-card'>Seite 1</div>
      {items.map((item, i) => (
        <div key={i} className='flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50'>
          <div className='flex-1'>
            <span style={{ background: item.color, padding: '1px 3px', boxDecorationBreak: 'clone' }}
              className={item.low ? 'text-muted-foreground font-mono' : 'font-mono'}>
              {item.text}
            </span>
          </div>
          {item.suggested && (
            <div className='flex gap-0.5 shrink-0'>
              <div className='w-4 h-4 rounded-sm bg-green-500 flex items-center justify-center'>
                <Check className='h-2.5 w-2.5 text-white' />
              </div>
              <div className='w-4 h-4 rounded-sm bg-red-500 flex items-center justify-center'>
                <X className='h-2.5 w-2.5 text-white' />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function MockFOI() {
  return (
    <div className='p-3 flex flex-col gap-2 text-[11px]'>
      <div className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide'>Schwärzungsgrund</div>
      <div className='flex flex-col gap-0.5'>
        <div className='flex items-center gap-1 px-2 py-1 rounded text-muted-foreground'>
          <ChevronDown className='h-2.5 w-2.5' />
          <span className='font-medium'>Besondere öffentliche Belange</span>
        </div>
        <div className='pl-5 flex flex-col gap-0.5'>
          <div className='px-2 py-0.5 text-muted-foreground/60'>Internationale Beziehungen</div>
          <div className='px-2 py-0.5 text-muted-foreground/60'>Öffentliche Sicherheit</div>
        </div>
        <div className='pl-[22px] pr-2 py-1 rounded bg-primary/15 text-primary font-medium'>Personenbezogene Daten</div>
        <div className='flex items-center gap-1 px-2 py-1 rounded text-muted-foreground'>
          <ChevronDown className='h-2.5 w-2.5 rotate-[-90deg]' />
          <span className='font-medium'>IP &amp; Geschäftsgeheimnisse</span>
        </div>
      </div>
    </div>
  )
}

function MockManual() {
  return (
    <div className='p-3 text-[11px] font-mono leading-relaxed text-foreground/80'>
      <p>Am 18. November 2024 fand ein Video-Call statt.</p>
      <p className='mt-1'>
        Anwesend:{' '}
        <span style={{ background: 'rgba(253,224,71,0.5)', padding: '1px 2px' }}>Anna Schneider</span>
        ,{' '}
        <span style={{ background: 'rgba(253,224,71,0.5)', padding: '1px 2px' }}>Peter Krause</span>
        ,{' '}
        <span style={{ background: 'rgba(253,224,71,0.5)', padding: '1px 2px' }}>Lena Hoffmann</span>
      </p>
      <p className='mt-1'>
        Kontakt:{' '}
        <span style={{ background: 'rgba(253,224,71,0.25)', padding: '1px 2px' }} className='text-muted-foreground'>
          l.hoffmann@example.de
        </span>
      </p>
    </div>
  )
}

function MockPersons() {
  return (
    <div className='p-3 flex flex-col gap-2 text-[11px]'>
      <div className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide px-1'>Privatpersonen</div>
      <div className='mx-1 rounded-lg ring-1 ring-border'>
        <div className='flex items-center pl-3 pr-2 py-1.5 gap-2 border-b border-border/50'>
          <span className='flex-1 font-medium text-foreground'>Anna Schneider</span>
          <Check className='h-3 w-3 text-green-600' />
          <X className='h-3 w-3 text-red-500' />
        </div>
        <div className='px-3 py-1.5'><span style={{ background: 'rgba(253,224,71,0.5)', padding: '1px 3px' }}>Anna Schneider</span></div>
        <div className='px-3 py-1.5'><span style={{ background: 'rgba(253,224,71,0.5)', padding: '1px 3px' }}>Schneider</span></div>
      </div>
      <div className='mx-1 rounded-lg ring-1 ring-border'>
        <div className='flex items-center pl-3 pr-2 py-1.5 gap-2 border-b border-border/50'>
          <span className='flex-1 font-medium text-foreground'>Thomas Berger</span>
          <Check className='h-3 w-3 text-green-600' />
          <X className='h-3 w-3 text-red-500' />
        </div>
        <div className='px-3 py-1.5'><span style={{ background: 'rgba(253,224,71,0.5)', padding: '1px 3px' }}>Thomas Berger</span></div>
      </div>
    </div>
  )
}

function MockPrivacy() {
  const options = [
    { id: 'cloud',   label: 'Cloud-KI',          sub: 'Azure OpenAI — keine Data Retention', active: true,  muted: false },
    { id: 'local',   label: 'Lokales LLM',       sub: 'Ollama-kompatibler Endpunkt',     active: false, muted: false },
    { id: 'spacy',   label: 'spaCy NLP',         sub: 'Docker only',                    active: false, muted: true },
    { id: 'browser', label: 'Browser NLP',       sub: 'In-Browser, vollständig offline', active: false, muted: true },
  ]
  return (
    <div className='p-3 flex flex-col gap-1 text-[11px]'>
      <div className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1'>Datenverarbeitung</div>
      {options.map(o => (
        <div key={o.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${o.active ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground'} ${o.muted ? 'opacity-40' : ''}`}>
          <div className='flex-1 min-w-0'>
            <div className='font-medium'>{o.label}</div>
            {o.sub && <div className={`text-[9px] truncate ${o.active ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{o.sub}</div>}
          </div>
          {o.muted && <span className='text-[9px] opacity-60 shrink-0'>coming soon</span>}
        </div>
      ))}
    </div>
  )
}

function MockMultiDoc() {
  const docs = ['Bescheid-2024-001.pdf', 'Anlage-A.pdf', 'Protokoll.pdf']
  return (
    <div className='p-3 flex flex-col gap-2 text-[11px]'>
      <div className='flex gap-1 border-b border-gray-200 pb-2'>
        {docs.map((d, i) => (
          <div key={d} className={`px-2 py-1 rounded-t text-[10px] truncate max-w-[100px] ${i === 0 ? 'bg-white border border-b-white border-gray-200 -mb-px font-medium' : 'text-gray-400'}`}>
            {d}
          </div>
        ))}
      </div>
      <div className='text-[10px] text-muted-foreground font-mono leading-relaxed'>
        <p>Betreff: Antrag auf Akteneinsicht</p>
        <p className='mt-1'>Datum: 18.11.2024</p>
        <p className='mt-1'>Ansprechpartner: <span style={{ background: 'rgba(253,224,71,0.5)', padding: '1px 2px' }}>Thomas Berger</span></p>
      </div>
      <div className='text-[10px] text-muted-foreground bg-muted/50 rounded px-2 py-1'>
        KI-Assistent hat Kontext über alle 3 Dokumente
      </div>
    </div>
  )
}

function MockExport() {
  return (
    <div className='p-3 flex flex-col gap-2 text-[11px]'>
      <div className='text-[10px] text-muted-foreground font-mono leading-relaxed'>
        <p>Am 18. November 2024 fand ein Video-Call statt.</p>
        <p className='mt-1'>Anwesend: <span style={{ background: 'rgba(0,0,0,0.45)', padding: '1px 3px', color: 'transparent' }}>██████████████</span>, <span style={{ background: 'rgba(0,0,0,0.45)', padding: '1px 3px', color: 'transparent' }}>████████████</span></p>
        <p className='mt-1'>Kontakt: <span style={{ background: 'rgba(0,0,0,0.45)', padding: '1px 3px', color: 'transparent' }}>████████████████████</span></p>
      </div>
      <div className='flex gap-2 mt-1'>
        <div className='flex-1 flex items-center justify-center gap-1.5 border rounded px-2 py-1.5 text-[10px] font-medium'>
          <Download className='h-2.5 w-2.5' /> Export
        </div>
        <div className='flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded px-2 py-1.5 text-[10px] font-medium'>
          Schwärzen & Speichern
        </div>
      </div>
    </div>
  )
}

// ── Feature cards ──────────────────────────────────────────────────────────────

const features = [
  {
    title: 'KI-Assistent',
    description: 'Ein Chat-Agent liest das Dokument, stellt gezielte Rückfragen und schlägt in einem Schritt alle relevanten Schwärzungen vor — mit Konfidenzwert für jeden Vorschlag.',
    mockup: <MockChat />,
  },
  {
    title: 'Schwärzungsliste',
    description: 'Alle Schwärzungen in chronologischer Reihenfolge oder nach Person gruppiert. Vorschläge mit einem Klick akzeptieren oder ablehnen — einzeln oder en bloc.',
    mockup: <MockRedactions />,
  },
  {
    title: 'Informationsfreiheitsmodus',
    description: 'Im Informationsfreiheitsmodus wird jeder Schwärzung ein konkreter Rechtsgrund zugeordnet — §3–6 Informationsfreiheitsgesetz Bund, EU-Verordnung 1049/2001 und weitere Rechtsordnungen.',
    mockup: <MockFOI />,
  },
  {
    title: 'Manuelle Schwärzung',
    description: 'Textstellen per Klick-und-Ziehen oder freihändig direkt im Dokument auswählen. Vorschläge des Assistenten mit einem Klick akzeptieren oder ablehnen.',
    mockup: <MockManual />,
  },
  {
    title: 'Personen-Gruppenansicht',
    description: 'Schwärzungen werden in der linken Seitenleiste nach Person und Kategorie gruppiert. Alle Einträge einer Person lassen sich auf einmal akzeptieren oder ablehnen.',
    mockup: <MockPersons />,
  },
  {
    title: 'Mehrere Dokumente',
    description: 'PDFs und DOCX-Dateien als Batch hochladen. Der Assistent hat Kontext über alle Dokumente gleichzeitig und kann dokumentübergreifend Vorschläge erstellen.',
    mockup: <MockMultiDoc />,
  },
  {
    title: 'Datensouveränität',
    description: 'Wahl zwischen Azure OpenAI (DSGVO-konform, keine Data Retention), einem Ollama-kompatiblen Sprachmodell auf eigenem Server, oder vollständig lokaler Sprachverarbeitung im Browser — ohne jede Cloud-Verbindung.',
    mockup: <MockPrivacy />,
  },
  {
    title: 'Export',
    description: 'Vorschau-Export mit sichtbaren Markierungen zum internen Review. Finaler Export mit unwiderruflich entferntem Text — bereit zur Veröffentlichung.',
    mockup: <MockExport />,
  },
]

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  return (
    <div className='min-h-screen bg-white text-foreground flex flex-col'>

      {/* Header */}
      <header className='shrink-0 flex items-center gap-3 px-4 border-b bg-muted/50 h-11'>
        <Link href='/' className='flex items-center gap-2 shrink-0'>
          <div className='w-7 h-7 rounded-lg bg-primary flex items-center justify-center'>
            <span className='text-primary-foreground text-xs font-bold'>E</span>
          </div>
          <span className='font-semibold text-sm'>EasyRedact</span>
        </Link>
        <Link href='/app' className='ml-auto flex items-center gap-1.5 text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors font-medium'>
          Zur App <ArrowRight className='h-3 w-3' />
        </Link>
      </header>

      {/* Hero */}
      <section className='flex flex-col items-center text-center px-6 pt-16 pb-12 gap-5'>
        <h1 className='text-4xl font-bold tracking-tight max-w-xl'>
          Sensible Daten.<br />Automatisch geschwärzt.
        </h1>
        <p className='text-lg text-gray-500 leading-relaxed max-w-lg'>
          EasyRedact kombiniert einen intelligenten KI-Assistenten mit einem PDF-Viewer —
          für Schwärzungen nach Datenschutz- und Informationsfreiheitsrecht.
        </p>
        <Link href='/app'
          className='flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors'>
          App öffnen <ArrowRight className='h-4 w-4' />
        </Link>
      </section>

      {/* Features */}
      <section id='features' className='px-6 py-10 max-w-5xl mx-auto w-full'>
        <p className='text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-8'>Features</p>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {features.map(f => (
            <div key={f.title} className='rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden flex flex-col'>
              {/* Text header */}
              <div className='px-5 pt-5 pb-4'>
                <h3 className='font-semibold text-sm text-gray-900 mb-1'>{f.title}</h3>
                <p className='text-xs text-gray-500 leading-relaxed'>{f.description}</p>
              </div>
              {/* Mockup area */}
              <div className='mx-4 mb-4 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden'>
                {f.mockup}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className='px-6 py-12 border-t bg-gray-50'>
        <div className='max-w-3xl mx-auto flex flex-col gap-8'>
          <div className='text-center flex flex-col gap-2'>
            <p className='text-xs font-semibold text-gray-400 uppercase tracking-widest'>Workflow</p>
            <h2 className='text-2xl font-bold'>In drei Schritten zum geschwärzten Dokument</h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {[
              { n: '1', title: 'Hochladen', desc: 'PDF oder DOCX per Drag & Drop. Mehrere Dokumente gleichzeitig möglich.' },
              { n: '2', title: 'Mit KI schwärzen', desc: 'Assistent liest das Dokument, schlägt Schwärzungen vor. Vorschläge prüfen und anpassen.' },
              { n: '3', title: 'Exportieren', desc: 'Vorschau-PDF oder finale Version mit unwiderruflich entferntem Text.' },
            ].map(step => (
              <div key={step.n} className='flex flex-col items-center text-center gap-3'>
                <div className='w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0'>
                  {step.n}
                </div>
                <h3 className='font-semibold text-sm'>{step.title}</h3>
                <p className='text-xs text-gray-500 leading-relaxed'>{step.desc}</p>
              </div>
            ))}
          </div>
          <div className='flex justify-center'>
            <Link href='/app'
              className='flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors'>
              Jetzt starten <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className='border-t bg-white px-6 py-4 flex flex-col items-center gap-1 text-xs text-gray-400'>
        <span>EasyRedact</span>
        <a href='https://github.com/datenlabor-bmz/easy-redact' target='_blank' rel='noopener noreferrer' className='hover:text-gray-600 transition-colors'>
          Open Source
        </a>
      </footer>

    </div>
  )
}
