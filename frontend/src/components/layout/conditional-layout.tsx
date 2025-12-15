'use client'

import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/footer/footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()

  // Check pathname immediately - no need to wait for mount
  // usePathname() works on both server and client
  const isDashboard = pathname?.startsWith('/dashboard') || false
  const isAuth = pathname?.startsWith('/auth') || false
  const isAdmin = pathname?.startsWith('/admin') || false
  const isPrivacy = pathname === '/privacy' || false

  // Hide navbar and footer for dashboard, auth, admin, and privacy pages
  if (isDashboard || isAuth || isAdmin || isPrivacy) {
    return <>{children}</>
  }

  // Show navbar and footer for all other pages
  return (
    <>
      <Navbar />
      <main className="pt-0">{children}</main>
      <Footer />
    </>
  )
}
