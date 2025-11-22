'use client'

import { useEffect } from 'react'
import { initializeCookieTracking } from '@/lib/cookies'

export function CookieProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeCookieTracking()
  }, [])

  return <>{children}</>
}

