import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        background: '#1c2236',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '40px',
      }}
    >
      <span style={{ color: 'white', fontSize: '110px', fontWeight: 800, fontFamily: 'sans-serif' }}>E</span>
    </div>,
    { ...size },
  )
}
