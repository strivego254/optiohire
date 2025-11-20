'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { FileText, Search, ArrowLeft, Trash2 } from 'lucide-react'

interface Application {
  application_id: string
  candidate_name: string
  email: string
  job_title: string
  company_name: string
  ai_status: string
  ai_score: number | null
  created_at: string
}

export default function AdminApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    // STRICT: Only admin can access
    if (user && user.role !== 'admin') {
      router.push('/admin') // Redirect to admin dashboard, not HR dashboard
      return
    }
    if (!user) {
      router.push('/auth/signin')
      return
    }
    loadApplications()
  }, [page, search, statusFilter, user, router])

  const loadApplications = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { ai_status: statusFilter })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 403) {
        router.push('/auth/signin')
        return
      }

      const data = await response.json()
      setApplications(data.applications || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error loading applications:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteApplication = async (applicationId: string) => {
    if (!confirm('Are you sure you want to delete this application?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadApplications()
      }
    } catch (error) {
      console.error('Error deleting application:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SHORTLIST':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'FLAG':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'REJECT':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin')}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Manage Applications</h1>
            <p className="text-gray-400">View and manage all applications</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search applications..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10 bg-neutral-800 border-neutral-700 text-white"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-md text-white"
              >
                <option value="">All Status</option>
                <option value="SHORTLIST">Shortlisted</option>
                <option value="FLAG">Flagged</option>
                <option value="REJECT">Rejected</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader>
                <CardTitle>Applications ({total})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {applications.map((app) => (
                    <div
                      key={app.application_id}
                      className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-750"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-5 w-5 text-orange-400" />
                          <span className="font-semibold">{app.candidate_name || 'Unknown'}</span>
                          <Badge className={getStatusColor(app.ai_status || '')}>
                            {app.ai_status || 'PENDING'}
                          </Badge>
                          {app.ai_score !== null && (
                            <span className="text-sm text-gray-400">
                              Score: {app.ai_score.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                          <div>
                            <span className="text-gray-500">Email:</span> {app.email}
                          </div>
                          <div>
                            <span className="text-gray-500">Job:</span> {app.job_title}
                          </div>
                          <div>
                            <span className="text-gray-500">Company:</span> {app.company_name}
                          </div>
                          <div>
                            <span className="text-gray-500">Applied:</span> {new Date(app.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteApplication(app.application_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {applications.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No applications found
                  </div>
                )}

                {total > 20 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-gray-400">
                      Page {page} of {Math.ceil(total / 20)}
                    </span>
                    <Button
                      variant="outline"
                      disabled={page >= Math.ceil(total / 20)}
                      onClick={() => setPage(p => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}

