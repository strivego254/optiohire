'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { OptimizedDashboardLayout } from '@/components/dashboard/optimized-dashboard-layout'

export default function DashboardPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Don't redirect while loading
    if (loading) return
    
    // Redirect admin to admin dashboard
    if (user && user.role === 'admin') {
      router.push('/admin')
      return
    }
    
    // Only redirect to sign-in if there's no user AND no token
    // This prevents redirecting when API call is still in progress or failed
    if (!user) {
      const token = localStorage.getItem('token')
      if (!token) {
        // No token and no user - definitely need to sign in
        router.push('/auth/signin')
      }
      // If token exists but no user, wait a bit more for auth to complete
      // The auth hook will set user from token eventually
    }
  }, [user, loading, router])

  // Show loading while checking
  if (loading || (user && user.role === 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D2DDD] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // Show loading while redirecting (brief moment)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D2DDD] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  try {
    return <OptimizedDashboardLayout />
  } catch (error) {
    console.error('Dashboard render error:', error)
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#2D2DDD] text-white rounded-lg hover:bg-[#2D2DDD] shadow-none hover:shadow-none"
          >
            Refresh Page
          </button>
        </div>
      </div>
    )
  }
}