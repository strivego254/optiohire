'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from '@/components/navigation/navbar'
import { Footer } from '@/components/footer/footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  const isDashboard = pathname.startsWith('/dashboard')
  const isAuth = pathname.startsWith('/auth')
  const isAdmin = pathname.startsWith('/admin')

  // Hide navbar and footer for dashboard, auth, and admin pages
  if (isDashboard || isAuth || isAdmin) {
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
