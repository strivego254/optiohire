'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Building2, 
  Briefcase, 
  Users, 
  Calendar, 
  Video,
  Shield,
  Key,
  Loader2,
  AlertTriangle
} from 'lucide-react'

interface UserDetails {
  user_id: string
  username?: string | null
  name?: string | null
  email: string
  role: string
  company_role?: string | null
  is_active: boolean
  created_at: string
  company?: {
    company_id: string
    company_name: string
    company_email: string
    hr_email: string
    hiring_manager_email: string
  } | null
  stats?: {
    job_posts_count: number
    applicants_count: number
    interviews_count: number
    meetings_count: number
  }
}

export default function UserDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user: currentAdmin } = useAuth()
  const userId = params.userId as string
  
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isSeniorAdmin = currentAdmin?.email === 'hirebitapplications@gmail.com'

  useEffect(() => {
    if (!currentAdmin || currentAdmin.role !== 'admin') {
      router.push('/admin')
      return
    }
    fetchUserDetails()
  }, [userId, currentAdmin])

  const fetchUserDetails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      
      // Fetch user details
      const userResponse = await fetch(`${backendUrl}/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user details')
      }

      const userData = await userResponse.json()
      
      // Fetch user statistics
      const statsResponse = await fetch(`${backendUrl}/api/admin/users/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      let stats = null
      if (statsResponse.ok) {
        stats = await statsResponse.json()
      }

      setUserDetails({
        ...userData,
        stats: stats || {
          job_posts_count: 0,
          applicants_count: 0,
          interviews_count: 0,
          meetings_count: 0
        }
      })
    } catch (err: any) {
      console.error('Error fetching user details:', err)
      setError(err.message || 'Failed to load user details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2D2DDD]" />
      </div>
    )
  }

  if (error || !userDetails) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <p>{error || 'User not found'}</p>
              </div>
              <Button onClick={() => router.push('/admin')} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Users
          </Button>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <User className="w-6 h-6" />
                  {userDetails.name || 'No Name'}
                  {userDetails.username && (
                    <span className="text-lg font-normal text-gray-500 dark:text-gray-400">
                      @{userDetails.username}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="mt-2">{userDetails.email}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={userDetails.is_active ? 'default' : 'destructive'}>
                  {userDetails.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <Badge variant="outline">{userDetails.role}</Badge>
                {userDetails.company_role && (
                  <Badge variant="secondary" className="capitalize">
                    {userDetails.company_role === 'hr' ? 'HR Manager' : 'Hiring Manager'}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
                <p className="text-gray-900 dark:text-white">{userDetails.email}</p>
              </div>
              
              {userDetails.username && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <User className="w-4 h-4" />
                    Username
                  </div>
                  <p className="text-gray-900 dark:text-white font-mono">@{userDetails.username}</p>
                </div>
              )}
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Shield className="w-4 h-4" />
                  Role
                </div>
                <p className="text-gray-900 dark:text-white capitalize">{userDetails.role}</p>
              </div>
              
              {userDetails.company_role && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <Key className="w-4 h-4" />
                    Company Role
                  </div>
                  <p className="text-gray-900 dark:text-white capitalize">
                    {userDetails.company_role === 'hr' ? 'HR Manager' : 'Hiring Manager'}
                  </p>
                </div>
              )}
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Calendar className="w-4 h-4" />
                  Member Since
                </div>
                <p className="text-gray-900 dark:text-white">
                  {new Date(userDetails.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Company Details */}
        {userDetails.company && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Organization Name</div>
                  <p className="text-gray-900 dark:text-white">{userDetails.company.company_name}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Company Email</div>
                  <p className="text-gray-900 dark:text-white">{userDetails.company.company_email}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">HR Email</div>
                  <p className="text-gray-900 dark:text-white">{userDetails.company.hr_email}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Hiring Manager Email</div>
                  <p className="text-gray-900 dark:text-white">{userDetails.company.hiring_manager_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        {userDetails.stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Job Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-[#2D2DDD]" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userDetails.stats.job_posts_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Jobs</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Applicants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userDetails.stats.applicants_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Applicants</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Interviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userDetails.stats.interviews_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Scheduled</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Video className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {userDetails.stats.meetings_count}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total Meetings</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

