import { getLocale, getTranslations } from 'next-intl/server'
import { Link } from '@/lib/navigation'
import { Bot, Download, ArrowRight, Check, X, ChevronDown, Cloud, Shield, Server, Globe, Cpu, Zap, FileText, ExternalLink, Trash2, FileUp } from 'lucide-react'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'

// ── Mini UI mockups (illustrative, intentionally static) ──────────────────────

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
  return (
    <div className='p-4 flex flex-col items-center gap-3 text-[11px]'>
      <div className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide'>KI-Modus</div>
      <div className='flex h-8 rounded-lg border bg-muted/50 p-0.5'>
        <div className='flex items-center gap-1.5 px-3 rounded-md bg-background shadow-sm text-foreground font-medium'>
          <Cloud className='h-3 w-3 text-blue-500' />
          Cloud AI
        </div>
        <div className='flex items-center gap-1.5 px-3 rounded-md text-muted-foreground'>
          <Shield className='h-3 w-3 text-green-600' />
          Local AI
        </div>
      </div>
      <div className='text-[10px] text-muted-foreground text-center leading-relaxed max-w-[200px]'>
        Jederzeit umschaltbar. Cloud-KI ist DSGVO-konform (EU-Rechenzentrum). Local AI verlässt nie Ihre Infrastruktur.
      </div>
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
          Schwärzen &amp; Speichern
        </div>
      </div>
    </div>
  )
}

function MockMetadata() {
  const fields = [
    { label: 'Title', value: '2024 Protokoll MV', remove: true },
    { label: 'Author', value: 'Anna Schneider', remove: true },
    { label: 'Created with', value: 'Google Docs', remove: false },
  ]
  return (
    <div className='p-3 flex flex-col gap-1.5 text-[11px]'>
      <div className='text-[10px] font-semibold text-muted-foreground uppercase tracking-wide'>Metadata</div>
      {fields.map(f => (
        <div key={f.label} className='flex items-center gap-2 px-2 py-1 rounded border border-border/50'>
          <span className='text-muted-foreground w-16 shrink-0'>{f.label}</span>
          <span className='flex-1 font-mono truncate'>{f.value}</span>
          {f.remove ? (
            <div className='flex items-center gap-1 text-red-500'>
              <Trash2 className='h-2.5 w-2.5' />
              <Check className='h-2.5 w-2.5' />
            </div>
          ) : (
            <div className='w-[26px]' />
          )}
        </div>
      ))}
    </div>
  )
}

function MockI18n() {
  const langs = [
    { label: 'Deutsch', active: true },
    { label: 'English', active: false },
    { label: 'Français', active: false },
    { label: 'Español', active: false },
    { label: 'العربية', active: false },
    { label: 'Русский', active: false },
    { label: '中文', active: false },
  ]
  const laws = ['IFG', 'EU 1049/2001', 'CRPA', 'FOIA UK', 'FOIA US']
  return (
    <div className='p-3 flex flex-col gap-3 text-[11px]'>
      <div>
        <div className='flex items-center gap-1.5 text-muted-foreground mb-1.5'>
          <Globe className='h-3 w-3' />
          <span className='text-[10px] font-semibold uppercase tracking-wide'>Sprache</span>
        </div>
        <div className='flex flex-wrap gap-1'>
          {langs.map(l => (
            <div key={l.label} className={`px-2 py-1 rounded text-[10px] ${l.active ? 'bg-primary text-primary-foreground font-medium' : 'bg-muted text-muted-foreground'}`}>
              {l.label}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className='flex items-center gap-1.5 text-muted-foreground mb-1.5'>
          <FileText className='h-3 w-3' />
          <span className='text-[10px] font-semibold uppercase tracking-wide'>IFG / FOI</span>
        </div>
        <div className='flex flex-wrap gap-1'>
          {laws.map(l => (
            <div key={l} className='px-2 py-1 rounded text-[10px] bg-muted text-muted-foreground'>{l}</div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MockDocx() {
  return (
    <div className='p-3 flex flex-col gap-2 text-[11px]'>
      <div className='flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-border'>
        <FileUp className='h-4 w-4 text-muted-foreground' />
        <div className='flex-1'>
          <div className='font-medium text-foreground'>Bescheid-2024.docx</div>
          <div className='text-[9px] text-muted-foreground'>142 KB</div>
        </div>
      </div>
      <div className='flex items-center gap-2 text-[10px] text-muted-foreground px-1'>
        <div className='h-1 flex-1 rounded-full bg-muted overflow-hidden'>
          <div className='h-full w-3/4 bg-primary rounded-full' />
        </div>
        DOCX → PDF
      </div>
      <div className='flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-muted/30'>
        <FileText className='h-4 w-4 text-primary' />
        <div className='flex-1'>
          <div className='font-medium text-foreground'>Bescheid-2024.pdf</div>
          <div className='text-[9px] text-muted-foreground'>→ Bereit zur Schwärzung</div>
        </div>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function AboutPage() {
  const locale = await getLocale()
  const t = await getTranslations('About')
  const d = await getTranslations('Deployment')
  const c = await getTranslations('Compliance')

  const features = [
    { title: t('featureAITitle'),       description: t('featureAIDesc'),       mockup: <MockChat /> },
    { title: t('featureListTitle'),     description: t('featureListDesc'),     mockup: <MockRedactions /> },
    { title: t('featureFOITitle'),      description: t('featureFOIDesc'),      mockup: <MockFOI /> },
    { title: t('featureManualTitle'),   description: t('featureManualDesc'),   mockup: <MockManual /> },
    { title: t('featureGroupTitle'),    description: t('featureGroupDesc'),    mockup: <MockPersons /> },
    { title: t('featureMultiDocTitle'), description: t('featureMultiDocDesc'), mockup: <MockMultiDoc /> },
    { title: t('featurePrivacyTitle'),  description: t('featurePrivacyDesc'),  mockup: <MockPrivacy /> },
    { title: t('featureMetadataTitle'), description: t('featureMetadataDesc'), mockup: <MockMetadata /> },
    { title: t('featureDocxTitle'),     description: t('featureDocxDesc'),     mockup: <MockDocx /> },
    { title: t('featureExportTitle'),   description: t('featureExportDesc'),   mockup: <MockExport /> },
    { title: t('featureI18nTitle'),     description: t('featureI18nDesc'),     mockup: <MockI18n /> },
  ]

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
        <div className='ml-auto'>
          <LocaleSwitcher />
        </div>
      </header>

      {/* Hero */}
      <section className='flex flex-col items-center text-center px-6 pt-16 pb-12 gap-5'>
        <h1 className='text-4xl font-bold tracking-tight max-w-xl whitespace-pre-line'>
          {t('heroTitle')}
        </h1>
        <p className='text-lg text-gray-500 leading-relaxed max-w-lg'>
          {t('heroDesc')}
        </p>
        <Link href='/app'
          className='flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors'>
          {t('startNow')} <ArrowRight className='h-4 w-4' />
        </Link>
      </section>

      {/* Features */}
      <section id='features' className='px-6 py-10 max-w-5xl mx-auto w-full'>
        <p className='text-xs font-semibold text-gray-400 uppercase tracking-widest text-center mb-8'>{t('featuresLabel')}</p>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
          {features.map(f => (
            <div key={f.title} className='rounded-xl border border-gray-200 bg-gray-50/50 overflow-hidden flex flex-col'>
              <div className='px-5 pt-5 pb-4'>
                <h3 className='font-semibold text-sm text-gray-900 mb-1'>{f.title}</h3>
                <p className='text-xs text-gray-500 leading-relaxed'>{f.description}</p>
              </div>
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
            <p className='text-xs font-semibold text-gray-400 uppercase tracking-widest'>{t('workflowLabel')}</p>
            <h2 className='text-2xl font-bold'>{t('workflowTitle')}</h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            {([
              { n: '1', title: t('step1Title'), desc: t('step1Desc') },
              { n: '2', title: t('step2Title'), desc: t('step2Desc') },
              { n: '3', title: t('step3Title'), desc: t('step3Desc') },
            ]).map(step => (
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
              {t('startNow')} <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
        </div>
      </section>

      {/* Deployment */}
      <section className='px-6 py-12 border-t'>
        <div className='max-w-4xl mx-auto flex flex-col gap-8'>
          <div className='text-center flex flex-col gap-2'>
            <p className='text-xs font-semibold text-gray-400 uppercase tracking-widest'>{d('label')}</p>
            <h2 className='text-2xl font-bold'>{d('title')}</h2>
          </div>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>

            {/* Online */}
            <div className='rounded-xl border border-gray-200 bg-gray-50/50 p-6 flex flex-col gap-4'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center'>
                  <Globe className='h-4 w-4 text-blue-600' />
                </div>
                <div>
                  <h3 className='font-semibold text-sm'>{d('onlineTitle')}</h3>
                  <p className='text-[11px] text-gray-400'>{d('onlineBadge')}</p>
                </div>
              </div>
              <p className='text-xs text-gray-500 leading-relaxed'>{d('onlineDesc')}</p>
              <div className='flex flex-col gap-2 text-xs'>
                <div className='flex items-start gap-2'>
                  <Cloud className='h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0' />
                  <span>{d('onlineStandard')}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <Shield className='h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0' />
                  <span>{d('onlineClassified')}</span>
                </div>
              </div>
              <div className='mt-auto pt-2 border-t border-gray-200 flex flex-col gap-1.5 text-xs text-gray-500'>
                <div className='flex items-center gap-1.5'>
                  <Check className='h-3 w-3 text-green-600 shrink-0' />
                  {d('openSource')}
                </div>
                <div className='flex items-center gap-1.5'>
                  <Check className='h-3 w-3 text-green-600 shrink-0' />
                  {d('noInstall')}
                </div>
              </div>
              <Link href='/app'
                className='flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-medium text-xs hover:bg-primary/90 transition-colors'>
                {t('startNow')} <ArrowRight className='h-3.5 w-3.5' />
              </Link>
            </div>

            {/* On-premise */}
            <div className='rounded-xl border-2 border-primary/30 bg-primary/[0.02] p-6 flex flex-col gap-4 relative'>
              <div className='flex items-center gap-2'>
                <div className='w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center'>
                  <Server className='h-4 w-4 text-primary' />
                </div>
                <div>
                  <h3 className='font-semibold text-sm'>{d('premiseTitle')}</h3>
                  <p className='text-[11px] text-gray-400'>{d('premiseBadge')}</p>
                </div>
              </div>
              <p className='text-xs text-gray-500 leading-relaxed'>{d('premiseDesc')}</p>
              <div className='flex flex-col gap-2 text-xs'>
                <div className='flex items-start gap-2'>
                  <Cloud className='h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0' />
                  <span>{d('premiseStandard')}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <Zap className='h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0' />
                  <span>{d('premiseClassifiedLlm')}</span>
                </div>
                <div className='flex items-start gap-2'>
                  <Cpu className='h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0' />
                  <span>{d('premiseClassifiedNer')}</span>
                </div>
              </div>
              <div className='mt-auto pt-2 border-t border-gray-200 flex flex-col gap-1.5 text-xs text-gray-500'>
                <div className='flex items-center gap-1.5'>
                  <Check className='h-3 w-3 text-green-600 shrink-0' />
                  {d('openSource')}
                </div>
                <div className='flex items-center gap-1.5'>
                  <Check className='h-3 w-3 text-green-600 shrink-0' />
                  {d('premiseDocker')}
                </div>
                <div className='flex items-center gap-1.5'>
                  <Check className='h-3 w-3 text-green-600 shrink-0' />
                  {d('premiseCompliance')}
                </div>
              </div>
              <a href='https://github.com/datenlabor-bmz/easy-redact#docker' target='_blank' rel='noopener noreferrer'
                className='flex items-center justify-center gap-2 border border-primary text-primary px-4 py-2.5 rounded-lg font-medium text-xs hover:bg-primary/5 transition-colors'>
                {d('dockerLink')} <ArrowRight className='h-3.5 w-3.5' />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className='px-6 py-12 border-t bg-gray-50'>
        <div className='max-w-4xl mx-auto flex flex-col gap-8'>
          <div className='text-center flex flex-col gap-2'>
            <p className='text-xs font-semibold text-gray-400 uppercase tracking-widest'>{c('label')}</p>
            <h2 className='text-2xl font-bold'>{c('title')}</h2>
          </div>
          <p className='text-sm text-gray-500 leading-relaxed text-center max-w-2xl mx-auto'>{c('desc')}</p>
          {locale === 'de' ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
              {([
                { title: c('systemTitle'), docs: [
                  { key: '01', file: '01_systemdokumentation.md', label: c('doc01') },
                  { key: '02', file: '02_c4_architektur.md', label: c('doc02') },
                  { key: '07', file: '07_betriebskonzept.md', label: c('doc07') },
                ]},
                { title: c('dataTitle'), docs: [
                  { key: '03', file: '03_ki_act_klassifizierung.md', label: c('doc03') },
                  { key: '04', file: '04_datenschutzinformation.md', label: c('doc04') },
                  { key: '05', file: '05_datenschutzfolgeabschaetzung.md', label: c('doc05') },
                  { key: '08', file: '08_verarbeitungsverzeichnis.md', label: c('doc08') },
                ]},
                { title: c('securityTitle'), docs: [
                  { key: '06', file: '06_sicherheitskonzept.md', label: c('doc06') },
                  { key: '09', file: '09_nutzungsrichtlinie.md', label: c('doc09') },
                ]},
              ]).map(group => (
                <div key={group.title} className='flex flex-col gap-2'>
                  <h3 className='text-xs font-semibold text-gray-400 uppercase tracking-wide'>{group.title}</h3>
                  <div className='flex flex-col gap-1'>
                    {group.docs.map(doc => (
                      <a key={doc.key}
                        href={`https://github.com/datenlabor-bmz/easy-redact/blob/main/docs/compliance/${doc.file}`}
                        target='_blank' rel='noopener noreferrer'
                        className='flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs text-gray-700 hover:border-primary/40 hover:text-primary transition-colors group'>
                        <FileText className='h-3.5 w-3.5 text-gray-400 group-hover:text-primary shrink-0' />
                        <span className='flex-1'>{doc.label}</span>
                        <ExternalLink className='h-3 w-3 text-gray-300 group-hover:text-primary/60 shrink-0' />
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-xs text-gray-400 text-center'>{c('descNonDe')}</p>
          )}
          <div className='flex justify-center'>
            <a href='https://github.com/datenlabor-bmz/easy-redact/releases/download/compliance-docs/EasyRedact_Compliance.zip'
              className='flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-medium text-xs hover:border-primary/40 hover:text-primary transition-colors'>
              <Download className='h-3.5 w-3.5' />
              {c('downloadZip')}
            </a>
          </div>
        </div>
      </section>

      {/* Credits */}
      <footer className='border-t bg-white px-6 py-10'>
        <div className='max-w-4xl mx-auto flex flex-col items-center gap-6'>
          <div className='grid grid-cols-2 gap-x-10 gap-y-2 justify-center max-w-sm mx-auto'>
            <p className='text-xs text-gray-400 text-center'>Funded by the<br />European Union</p>
            <div />
            <a href='https://next-generation-eu.europa.eu' target='_blank' rel='noopener noreferrer' className='justify-self-center'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src='/logo-nextgen-eu.jpg' alt='NextGenerationEU' className='h-[100px] rounded' />
            </a>
            <a href={locale === 'de'
              ? 'https://www.bmz-digital.global/initiativen-im-ueberblick/das-bmz-datenlabor/'
              : 'https://www.bmz-digital.global/en/overview-of-initiatives/the-bmz-data-lab/'}
              target='_blank' rel='noopener noreferrer' className='justify-self-center self-center'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src='/logo-datalab.svg' alt='BMZ DataLab' className='h-[74px]' />
            </a>
          </div>
          <div className='flex flex-col items-center gap-0.5 text-xs text-gray-400'>
            <span>EasyRedact</span>
            <a href='https://github.com/datenlabor-bmz/easy-redact' target='_blank' rel='noopener noreferrer' className='hover:text-gray-600 transition-colors'>
              Open Source
            </a>
          </div>
        </div>
      </footer>

    </div>
  )
}
