import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'EasyRedact — KI-gestützte Dokumentenschwärzung'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const LINES: { w: string; redacted?: true }[] = [
  { w: '75%' },
  { w: '100%', redacted: true },
  { w: '88%' },
  { w: '60%' },
  { w: '95%', redacted: true },
  { w: '80%' },
  { w: '100%' },
  { w: '70%', redacted: true },
  { w: '90%' },
  { w: '55%' },
  { w: '85%', redacted: true },
  { w: '100%' },
  { w: '72%' },
]

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f1524',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '80px',
          gap: '80px',
        }}
      >
        {/* Left: branding */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '14px',
                background: '#1e2d4e',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: 'white', fontSize: '36px', fontWeight: 800, fontFamily: 'sans-serif' }}>E</span>
            </div>
            <span
              style={{ color: '#e8edf8', fontSize: '32px', fontWeight: 700, fontFamily: 'sans-serif', letterSpacing: '-0.5px' }}
            >
              EasyRedact
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
            <div
              style={{
                color: 'white',
                fontSize: '64px',
                fontWeight: 800,
                fontFamily: 'sans-serif',
                lineHeight: 1.05,
                letterSpacing: '-2px',
              }}
            >
              Sensible Daten.
            </div>
            <div
              style={{
                color: 'white',
                fontSize: '64px',
                fontWeight: 800,
                fontFamily: 'sans-serif',
                lineHeight: 1.05,
                letterSpacing: '-2px',
              }}
            >
              Automatisch geschwärzt.
            </div>
          </div>
          <div style={{ color: '#6b85b0', fontSize: '24px', fontFamily: 'sans-serif', fontWeight: 400 }}>
            Hochladen · Schwärzen · Exportieren
          </div>
        </div>

        {/* Right: document mockup with redaction bars */}
        <div
          style={{
            width: '300px',
            height: '390px',
            background: 'white',
            borderRadius: '16px',
            padding: '30px 28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            flexShrink: 0,
            boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
          }}
        >
          {LINES.map((line, i) => (
            <div
              key={i}
              style={{
                height: '14px',
                background: line.redacted ? '#000' : '#e2e6ee',
                borderRadius: '3px',
                width: line.w,
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  )
}
