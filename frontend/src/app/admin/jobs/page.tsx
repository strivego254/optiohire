'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Search, ArrowLeft, Trash2 } from 'lucide-react'

interface JobPosting {
  job_posting_id: string
  job_title: string
  status: string
  company_name: string
  company_domain: string
  created_at: string
  application_deadline: string | null
}

export default function AdminJobsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [jobs, setJobs] = useState<JobPosting[]>([])
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
    loadJobs()
  }, [page, search, statusFilter, user, router])

  const loadJobs = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/job-postings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 401 || response.status === 403) {
        router.push('/auth/signin')
        return
      }

      const data = await response.json()
      setJobs(data.jobs || [])
      setTotal(data.total || 0)
    } catch (error) {
      console.error('Error loading jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting? This will delete all associated applications.')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/job-postings/${jobId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadJobs()
      }
    } catch (error) {
      console.error('Error deleting job:', error)
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
            <h1 className="text-3xl font-bold">Manage Job Postings</h1>
            <p className="text-gray-400">View and manage all job postings</p>
          </div>
        </div>

        <Card className="bg-neutral-900 border-neutral-800 mb-6">
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search jobs..."
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
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="DRAFT">Draft</option>
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
                <CardTitle>Job Postings ({total})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <div
                      key={job.job_posting_id}
                      className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg hover:bg-neutral-750"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Briefcase className="h-5 w-5 text-green-400" />
                          <span className="font-semibold text-lg">{job.job_title}</span>
                          <Badge 
                            variant={
                              job.status?.toUpperCase() === 'ACTIVE' ? 'active' :
                              job.status?.toUpperCase() === 'DRAFT' ? 'draft' :
                              job.status?.toUpperCase() === 'CLOSED' ? 'closed' :
                              'default'
                            }
                          >
                            {job.status?.toUpperCase() || 'ACTIVE'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-400">
                          <div>
                            <span className="text-gray-500">Company:</span> {job.company_name}
                          </div>
                          <div>
                            <span className="text-gray-500">Domain:</span> {job.company_domain}
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span> {new Date(job.created_at).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="text-gray-500">Deadline:</span> {job.application_deadline ? new Date(job.application_deadline).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteJob(job.job_posting_id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {jobs.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    No job postings found
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

