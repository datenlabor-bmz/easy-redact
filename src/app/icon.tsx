import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: '#1c2236',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '7px',
      }}
    >
      <span style={{ color: 'white', fontSize: '20px', fontWeight: 800, fontFamily: 'sans-serif' }}>E</span>
    </div>,
    { ...size },
  )
}
