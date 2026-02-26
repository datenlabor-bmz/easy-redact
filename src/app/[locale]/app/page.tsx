'use client'

import { useEffect } from 'react'
import dynamic from 'next/dynamic'

const AppComponent = dynamic(() => import('@/components/App'), { ssr: false })

export default function AppPage() {
  useEffect(() => { localStorage.setItem('hasVisitedApp', '1') }, [])
  return <AppComponent />
}
