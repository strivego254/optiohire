'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { OptimizedDashboardLayout } from '@/components/dashboard/optimized-dashboard-layout'

export default function InterviewsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return
    // STRICT: Admin should NOT access HR dashboard
    if (user && user.role === 'admin') {
      router.push('/admin')
      return
    }
  }, [user, loading, router])

  if (loading || (user && user.role === 'admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#2D2DDD] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return <OptimizedDashboardLayout />
}

