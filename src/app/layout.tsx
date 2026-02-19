import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'),
  title: 'EasyRedact — KI-gestützte Dokumentenschwärzung',
  description: 'Agentenbasierte KI-Schwärzung für PDF und DOCX — für IFG-Anfragen und PII',
  openGraph: {
    title: 'EasyRedact — KI-gestützte Dokumentenschwärzung',
    description: 'Agentenbasierte KI-Schwärzung für PDF und DOCX — für IFG-Anfragen und PII',
    type: 'website',
    locale: 'de_DE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EasyRedact — KI-gestützte Dokumentenschwärzung',
    description: 'Agentenbasierte KI-Schwärzung für PDF und DOCX — für IFG-Anfragen und PII',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='de' className={inter.variable}>
      <body className='antialiased font-sans'>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
