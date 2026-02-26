'use client'

import { useEffect } from 'react'
import { useRouter } from '@/lib/navigation'

export default function RootPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(localStorage.getItem('hasVisitedApp') ? '/app' : '/about')
  }, [router])
  return null
}
