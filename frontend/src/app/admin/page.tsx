'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  Building2, 
  Briefcase, 
  FileText, 
  BarChart3,
  Shield,
  TrendingUp,
  Activity
} from 'lucide-react'

interface SystemStats {
  users: { total: number; active: number; admins: number }
  companies: number
  job_postings: { total: number; active: number }
  applications: { total: number; shortlisted: number }
  reports: number
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // STRICT: Only admin can access
    if (!user) {
      router.push('/auth/signin')
      return
    }
    if (user.role !== 'admin') {
      router.push('/admin') // Stay in admin area
      return
    }
    loadStats()
  }, [user, router])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/auth/signin')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 403) {
        router.push('/auth/signin')
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load stats')
      }

      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardContent className="p-6">
            <p className="text-white">Failed to load admin dashboard. Please check your permissions.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage all system data and users</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-purple-900/20 to-purple-600/10 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Users</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.users.total}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.users.active} active • {stats.users.admins} admins
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-900/20 to-blue-600/10 border-blue-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Companies</CardTitle>
              <Building2 className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.companies}</div>
              <p className="text-xs text-gray-400 mt-1">Registered companies</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/20 to-green-600/10 border-green-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Job Postings</CardTitle>
              <Briefcase className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.job_postings.total}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.job_postings.active} active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-900/20 to-orange-600/10 border-orange-500/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Applications</CardTitle>
              <FileText className="h-4 w-4 text-orange-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.applications.total}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats.applications.shortlisted} shortlisted
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button
            onClick={() => router.push('/admin/users')}
            className="bg-neutral-800 hover:bg-neutral-700 text-white h-auto p-6 flex flex-col items-start"
          >
            <Users className="h-6 w-6 mb-2" />
            <span className="font-semibold">Manage Users</span>
            <span className="text-xs text-gray-400 mt-1">View and manage all users</span>
          </Button>

          <Button
            onClick={() => router.push('/admin/companies')}
            className="bg-neutral-800 hover:bg-neutral-700 text-white h-auto p-6 flex flex-col items-start"
          >
            <Building2 className="h-6 w-6 mb-2" />
            <span className="font-semibold">Manage Companies</span>
            <span className="text-xs text-gray-400 mt-1">View and manage companies</span>
          </Button>

          <Button
            onClick={() => router.push('/admin/jobs')}
            className="bg-neutral-800 hover:bg-neutral-700 text-white h-auto p-6 flex flex-col items-start"
          >
            <Briefcase className="h-6 w-6 mb-2" />
            <span className="font-semibold">Manage Jobs</span>
            <span className="text-xs text-gray-400 mt-1">View and manage job postings</span>
          </Button>

          <Button
            onClick={() => router.push('/admin/applications')}
            className="bg-neutral-800 hover:bg-neutral-700 text-white h-auto p-6 flex flex-col items-start"
          >
            <FileText className="h-6 w-6 mb-2" />
            <span className="font-semibold">Manage Applications</span>
            <span className="text-xs text-gray-400 mt-1">View and manage applications</span>
          </Button>
        </div>
      </div>
    </div>
  )
}

