'use client'

import { useState, useEffect, useCallback, Component, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/toaster'
import { Bell, X, CheckCircle2 } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NotificationProvider, useNotifications } from '@/contexts/notification-context'

// Simple Error Boundary component
class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <p className="text-gray-600 dark:text-gray-400">Something went wrong. Please refresh the page.</p>
        </div>
      )
    }

    return this.props.children
  }
}

// Dynamically load ToggleTheme to prevent webpack errors
const ToggleTheme = dynamic(
  () => import('@/components/ui/toggle-theme').then((mod) => {
    if (!mod || !mod.ToggleTheme) {
      throw new Error('ToggleTheme component not found')
    }
    return { default: mod.ToggleTheme }
  }).catch((err) => {
    console.error('Failed to load ToggleTheme:', err)
    // Return a fallback component
    return {
      default: () => (
        <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      )
    }
  }),
  {
    ssr: false,
    loading: () => (
      <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
    )
  }
)

// Dynamically load Sidebar to prevent webpack errors
const Sidebar = dynamic<{ activeSection: string; onSectionChange: (section: string) => void }>(
  () => import('./sidebar')
    .then((mod: any) => {
      if (!mod || typeof mod !== 'object') {
        throw new Error('Sidebar module not found')
      }
      const SidebarExport = mod.Sidebar
      if (!SidebarExport || typeof SidebarExport !== 'function') {
        console.error('Sidebar export not found. Available exports:', Object.keys(mod))
        throw new Error('Sidebar component not found')
      }
      return { default: SidebarExport }
    })
    .catch((err: any) => {
      console.error('Error loading Sidebar module:', err)
      // Return a safe fallback
      return {
        default: function SidebarFallback({ activeSection, onSectionChange }: { activeSection: string; onSectionChange: (section: string) => void }) {
          return (
            <div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen p-4">
              <p className="text-gray-600 dark:text-gray-400">Loading sidebar...</p>
            </div>
          )
        }
      }
    }),
  {
    ssr: false,
    loading: () => (
      <div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen">
        <div className="p-4">
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>
      </div>
    )
  }
)

// Loading component for sections
const SectionLoader = ({ sectionName }: { sectionName: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-[#2D2DDD] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading {sectionName}...</p>
    </div>
  </div>
)

// Safe fallback component for OverviewSection
const OverviewSectionFallback = function OverviewSectionFallback({ error }: { error?: any }) {
  return (
    <div className="p-6">
      <div className="text-center">
        <p className="text-red-500 mb-4">Failed to load overview section</p>
        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
          {error?.message || error?.toString() || 'Unknown error'}
        </p>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
        >
          Reload Page
        </Button>
      </div>
    </div>
  )
}

// Lazy load all sections for optimal performance using Next.js dynamic imports
const LazyOverviewSection = dynamic(
  () => {
    return Promise.resolve()
      .then(() => import('./sections/overview-section'))
      .then((mod: any) => {
        // Validate module exists
        if (!mod || typeof mod !== 'object') {
          console.error('OverviewSection module is null/undefined or not an object')
          throw new Error('OverviewSection module not found')
        }
        
        // Validate export exists and is a function
        const OverviewSectionExport = mod.OverviewSection
        if (!OverviewSectionExport) {
          console.error('OverviewSection export is missing. Available exports:', Object.keys(mod))
          throw new Error('OverviewSection export not found')
        }
        
        if (typeof OverviewSectionExport !== 'function') {
          console.error('OverviewSection export is not a function:', typeof OverviewSectionExport)
          throw new Error('OverviewSection export is not a valid component')
        }
        
        // Return the component wrapped as default export
        return { default: OverviewSectionExport }
      })
      .catch((err: any) => {
        console.error('Error loading OverviewSection module:', err)
        // Return a safe fallback component that doesn't throw
        return { default: () => <OverviewSectionFallback error={err} /> }
      })
  },
  { 
    loading: () => <SectionLoader sectionName="overview" />,
    ssr: false 
  }
)

const LazyJobsSection = dynamic(
  () => import('./sections/jobs-section')
    .then((mod: any) => {
      if (!mod || typeof mod !== 'object') {
        throw new Error('JobsSection module not found')
      }
      const JobsSectionExport = mod.JobsSection
      if (!JobsSectionExport || typeof JobsSectionExport !== 'function') {
        throw new Error('JobsSection not found in module')
      }
      return { default: JobsSectionExport }
    })
    .catch((err: any) => {
      console.error('Error loading JobsSection:', err)
      return {
        default: () => <SectionLoader sectionName="jobs" />
      }
    }),
  { 
    loading: () => <SectionLoader sectionName="jobs" />,
    ssr: false 
  }
)

const LazyReportsSection = dynamic(
  () => import('./sections/reports-section')
    .then((mod: any) => {
      if (!mod || typeof mod !== 'object') {
        throw new Error('ReportsSection module not found')
      }
      const ReportsSectionExport = mod.ReportsSection
      if (!ReportsSectionExport || typeof ReportsSectionExport !== 'function') {
        throw new Error('ReportsSection not found in module')
      }
      return { default: ReportsSectionExport }
    })
    .catch((err: any) => {
      console.error('Error loading ReportsSection:', err)
      return {
        default: () => <SectionLoader sectionName="reports" />
      }
    }),
  { 
    loading: () => <SectionLoader sectionName="reports" />,
    ssr: false 
  }
)

const LazyInterviewsSection = dynamic(
  () => import('./sections/interviews-section')
    .then((mod: any) => {
      if (!mod || typeof mod !== 'object') {
        throw new Error('InterviewsSection module not found')
      }
      const InterviewsSectionExport = mod.InterviewsSection
      if (!InterviewsSectionExport || typeof InterviewsSectionExport !== 'function') {
        throw new Error('InterviewsSection not found in module')
      }
      return { default: InterviewsSectionExport }
    })
    .catch((err: any) => {
      console.error('Error loading InterviewsSection:', err)
      return {
        default: () => <SectionLoader sectionName="interviews" />
      }
    }),
  { 
    loading: () => <SectionLoader sectionName="interviews" />,
    ssr: false 
  }
)

const LazyProfileSection = dynamic(
  () => import('./sections/profile-section')
    .then((mod: any) => {
      if (!mod || typeof mod !== 'object') {
        throw new Error('ProfileSection module not found')
      }
      const ProfileSectionExport = mod.ProfileSection
      if (!ProfileSectionExport || typeof ProfileSectionExport !== 'function') {
        throw new Error('ProfileSection not found in module')
      }
      return { default: ProfileSectionExport }
    })
    .catch((err: any) => {
      console.error('Error loading ProfileSection:', err)
      return {
        default: () => <SectionLoader sectionName="profile" />
      }
    }),
  { 
    loading: () => <SectionLoader sectionName="profile" />,
    ssr: false 
  }
)

function DashboardContent() {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState('overview')
  const [isPreloading, setIsPreloading] = useState(true)
  const [preloadTime, setPreloadTime] = useState<number>(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const { notifications, markAsRead, markAllAsRead, removeNotification, unreadCount } = useNotifications()

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
    // After signup, hasCompany should be true, but handle undefined/null cases
    // Only redirect if explicitly false AND no companyId
    if (user.hasCompany === false && !user.companyId) {
      console.error('Access denied: User has no company profile')
      localStorage.removeItem('token')
      router.push('/auth/signin?error=no_company')
      return
    }
    // If hasCompany is undefined but companyId exists, allow access (company exists)
    // This handles cases where hasCompany wasn't set but company was created
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
      
      // Preload components by importing them (with timeout to not block UI)
      // Wrap each import in a try-catch to prevent one failure from blocking others
      await Promise.race([
        Promise.allSettled([
          import('./sidebar').catch(err => {
            console.warn('Sidebar preload failed:', err)
            return null
          }),
          import('./sections/overview-section').catch(err => {
            console.warn('OverviewSection preload failed:', err)
            return null
          }),
        ]),
        new Promise(resolve => setTimeout(resolve, 200)) // Max 200ms preload time
      ])
      
      const endTime = performance.now()
      setPreloadTime(endTime - startTime)
      
      if (endTime - startTime < 200) {
        console.log(`🚀 Dashboard preloaded in ${(endTime - startTime).toFixed(2)}ms`)
      }
    } catch (error) {
      console.error('Dashboard preloading failed:', error)
      // Don't block rendering on preload errors
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
    if (isPreloading || !user) {
      return <SectionLoader sectionName="dashboard" />
    }

    try {
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
    } catch (error) {
      console.error('Error rendering section:', error)
      return (
        <div className="p-6 text-center">
          <p className="text-red-500 mb-4">Failed to render {activeSection} section</p>
          <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
          >
            Reload Page
          </Button>
        </div>
      )
    }
  }, [activeSection, isPreloading, user])

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

  // Don't render until user is loaded and validated
  // Only block if hasCompany is explicitly false AND no companyId exists
  // If companyId exists, allow access even if hasCompany is undefined/false
  if (loading || !user || (user.role !== 'admin' && user.hasCompany === false && !user.companyId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D2DDD] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

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
        {user && (
          <ErrorBoundary fallback={<div className="w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 h-screen p-4"><p className="text-gray-600 dark:text-gray-400">Loading sidebar...</p></div>}>
          <Sidebar 
            activeSection={activeSection} 
            onSectionChange={(section) => {
              handleSectionChange(section)
              setIsMobileMenuOpen(false)
            }}
          />
          </ErrorBoundary>
        )}
      </div>
      
      <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 w-full lg:w-auto">
        {/* Top Header with Theme Toggle and Notifications */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between p-4 md:p-6">
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg bg-[#2D2DDD] text-white hover:bg-[#2D2DDD] transition-colors shadow-none hover:shadow-none"
                aria-label="Menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            <div className="flex items-center gap-4 ml-auto">
              <ToggleTheme />
              
              {/* Notifications Bell - Moved to far right */}
              <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 w-10 p-0 relative border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <Bell className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 z-[100] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl backdrop-blur-none" align="end">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                      {notifications.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={markAllAsRead}
                          className="h-8 text-xs text-[#2D2DDD] hover:text-[#2D2DDD] hover:bg-[#2D2DDD]/10"
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No notifications</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                              !notification.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                                notification.type === 'success' ? 'bg-green-500' :
                                notification.type === 'error' ? 'bg-red-500' :
                                notification.type === 'warning' ? 'bg-yellow-500' :
                                'bg-blue-500'
                              } ${notification.read ? 'opacity-50' : ''}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className={`text-sm font-medium text-gray-900 dark:text-white ${
                                      notification.read ? 'opacity-60' : ''
                                    }`}>
                                      {notification.title}
                                    </p>
                                    <p className={`text-xs text-gray-600 dark:text-gray-400 mt-1 ${
                                      notification.read ? 'opacity-60' : ''
                                    }`}>
                                      {notification.description}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                  {!notification.read && (
                                    <button
                                      onClick={() => markAsRead(notification.id)}
                                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                      title="Mark as read"
                                    >
                                      <CheckCircle2 className="w-4 h-4 text-gray-400" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => removeNotification(notification.id)}
                                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                    title="Dismiss"
                                  >
                                    <X className="w-4 h-4 text-gray-400" />
                                  </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <div className="p-3 sm:p-4 md:p-6 lg:p-8">
          <ErrorBoundary fallback={<SectionLoader sectionName={activeSection} />}>
          {renderSection()}
          </ErrorBoundary>
        </div>
      </main>
      
      {/* Toast Notification System */}
      <Toaster />
    </div>
  )
}

export function OptimizedDashboardLayout() {
  return (
    <NotificationProvider>
      <DashboardContent />
    </NotificationProvider>
  )
}
