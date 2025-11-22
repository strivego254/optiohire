'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Sidebar } from './sidebar'
import { useAuth } from '@/hooks/use-auth'
import { ToggleTheme } from '@/components/ui/toggle-theme'

// Loading component for sections
const SectionLoader = ({ sectionName }: { sectionName: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-[#2D2DDD] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading {sectionName}...</p>
    </div>
  </div>
)

// Lazy load all sections for optimal performance using Next.js dynamic imports
const LazyOverviewSection = dynamic(
  () => import('./sections/overview-section').then(mod => ({ default: mod.OverviewSection })),
  { 
    loading: () => <SectionLoader sectionName="overview" />,
    ssr: false 
  }
)

const LazyJobsSection = dynamic(
  () => import('./sections/jobs-section').then(mod => ({ default: mod.JobsSection })),
  { 
    loading: () => <SectionLoader sectionName="jobs" />,
    ssr: false 
  }
)

const LazyReportsSection = dynamic(
  () => import('./sections/reports-section').then(mod => ({ default: mod.ReportsSection })),
  { 
    loading: () => <SectionLoader sectionName="reports" />,
    ssr: false 
  }
)

const LazyInterviewsSection = dynamic(
  () => import('./sections/interviews-section').then(mod => ({ default: mod.InterviewsSection })),
  { 
    loading: () => <SectionLoader sectionName="interviews" />,
    ssr: false 
  }
)

const LazyProfileSection = dynamic(
  () => import('./sections/profile-section').then(mod => ({ default: mod.ProfileSection })),
  { 
    loading: () => <SectionLoader sectionName="profile" />,
    ssr: false 
  }
)

export function OptimizedDashboardLayout() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('overview')
  const [isPreloading, setIsPreloading] = useState(true)
  const [preloadTime, setPreloadTime] = useState<number>(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // STRICT: Check if user has company (except admin)
  useEffect(() => {
    if (loading) return // Wait for auth to load
    
    if (!user) {
      router.push('/auth/signin')
      return
    }

    // STRICT: Admin should ONLY access admin dashboard, not HR dashboard
    if (user.role === 'admin') {
      router.push('/admin')
      return
    }

    // STRICT: Deny access if user has no company
    if (user.hasCompany === false) {
      console.error('Access denied: User has no company profile')
      localStorage.removeItem('token')
      router.push('/auth/signin?error=no_company')
      return
    }
  }, [user, loading, router])

  // Sync active section with URL pathname
  useEffect(() => {
    if (pathname === '/dashboard') {
      setActiveSection('overview')
    } else if (pathname === '/dashboard/jobs') {
      setActiveSection('jobs')
    } else if (pathname === '/dashboard/reports') {
      setActiveSection('reports')
    } else if (pathname === '/dashboard/interviews') {
      setActiveSection('interviews')
    } else if (pathname === '/dashboard/profile') {
      setActiveSection('profile')
    }
  }, [pathname])

  // Preload critical data for instant rendering
  const preloadCriticalData = useCallback(async () => {
    if (!user) {
      setIsPreloading(false)
      return
    }
    
    const startTime = performance.now()
    
    try {
      setIsPreloading(true)
      
      // Simple preload - just wait a moment for initial data
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const endTime = performance.now()
      setPreloadTime(endTime - startTime)
      
      console.log(`🚀 Dashboard preloaded in ${(endTime - startTime).toFixed(2)}ms`)
    } catch (error) {
      console.error('Dashboard preloading failed:', error)
    } finally {
      setIsPreloading(false)
    }
  }, [user])

  // Preload data on mount
  useEffect(() => {
    preloadCriticalData()
  }, [preloadCriticalData])

  // Optimized section rendering with lazy loading
  const renderSection = useCallback(() => {
    if (isPreloading) {
      return <SectionLoader sectionName="dashboard" />
    }

    switch (activeSection) {
      case 'overview':
        return <LazyOverviewSection />
      case 'jobs':
        return <LazyJobsSection />
      case 'reports':
        return <LazyReportsSection />
      case 'interviews':
        return <LazyInterviewsSection />
      case 'profile':
        return <LazyProfileSection />
      default:
        return <LazyOverviewSection />
    }
  }, [activeSection, isPreloading])

  // Optimized section change handler - now includes URL navigation
  const handleSectionChange = useCallback((section: string) => {
    setActiveSection(section)
    // Update URL using Next.js router for proper client-side navigation
    const sectionMap: Record<string, string> = {
      overview: '/dashboard',
      jobs: '/dashboard/jobs',
      reports: '/dashboard/reports',
      interviews: '/dashboard/interviews',
      profile: '/dashboard/profile'
    }
    const newPath = sectionMap[section] || '/dashboard'
    router.push(newPath)
  }, [router])

  return (
    <div className="flex min-h-screen bg-white dark:bg-black text-foreground">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile, visible on tablet and up */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 lg:z-auto transform transition-transform duration-300 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={(section) => {
            handleSectionChange(section)
            setIsMobileMenuOpen(false)
          }}
        />
      </div>
      
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 w-full lg:w-auto">
        {/* Top Header with Theme Toggle */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between p-4 md:p-6">
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-[#2D2DDD] text-white hover:bg-[#2D2DDD]/90 transition-colors"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-4">
              <ToggleTheme />
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          {renderSection()}
        </div>
      </main>
    </div>
  )
}
