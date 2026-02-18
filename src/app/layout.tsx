import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'EasyRedact — KI-gestützte Dokumentenschwärzung',
  description: 'Agentenbasierte KI-Schwärzung für PDF und DOCX — für IFG-Anfragen und PII',
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
