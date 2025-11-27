'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScheduleInterviewModal } from '@/components/modals/ScheduleInterviewModal'
import { Loader2, ArrowLeft, ExternalLink, Home, Briefcase, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { TopNavigation } from '@/components/dashboard/top-navigation'
import { cleanCandidateName } from '@/lib/utils'

interface CandidateDetail {
  id: string
  candidate_name: string
  email: string
  score: number | null
  status: string
  interview_time: string | null
  interview_link: string | null
  interview_status: string | null
  parsed_resume: any
  reasoning: string
  resume_url: string
}

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const applicantId = params.applicantId as string
  const { user, loading: authLoading } = useAuth()

  // STRICT: Admin should NOT access HR dashboard
  useEffect(() => {
    if (authLoading) return
    if (user && user.role === 'admin') {
      router.push('/admin')
      return
    }
  }, [user, authLoading, router])

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [meetingLink, setMeetingLink] = useState<string>('')

  useEffect(() => {
    if (!user) return
    if (!jobId || !applicantId) {
      setError('Invalid job ID or applicant ID')
      setLoading(false)
      return
    }
    fetchCandidateDetail()
    fetchMeetingLink()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId, jobId, user])

  const fetchCandidateDetail = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!applicantId) {
        throw new Error('Invalid applicant ID')
      }
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Use frontend API route instead of backend directly
      const response = await fetch(`/api/hr/candidates/${applicantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        let errorMessage = 'Failed to fetch candidate details'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage
        }
        
        if (response.status === 404) {
          throw new Error('Candidate not found')
        }
        if (response.status === 401) {
          throw new Error('Unauthorized - Please sign in again')
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      if (!data || !data.id) {
        throw new Error('Invalid candidate data received')
      }
      setCandidate(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load candidate details')
      setCandidate(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchMeetingLink = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Use frontend API route instead of backend directly
      const response = await fetch(`/api/job-postings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        const jobs = data.jobs || []
        const job = jobs.find((j: any) => (j.id || j.job_posting_id) === jobId)
        if (job) {
          setMeetingLink(job.meeting_link || job.interview_meeting_link || '')
        }
      }
    } catch (err) {
      console.error('Failed to fetch meeting link:', err)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SHORTLIST':
      case 'SHORTLISTED':
        return 'shortlisted'
      case 'FLAG':
      case 'FLAGGED':
        return 'flagged'
      case 'REJECT':
      case 'REJECTED':
        return 'rejected'
      default:
        return 'info'
    }
  }

  const isShortlisted = candidate?.status.toUpperCase() === 'SHORTLIST' || candidate?.status.toUpperCase() === 'SHORTLISTED'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <TopNavigation />
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-[#2D2DDD]" />
            <p className="text-gray-600 dark:text-gray-400">Loading candidate details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <TopNavigation />
            </div>
          </div>
        </div>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <p className="text-red-500 text-lg font-semibold mb-2">Failed to load candidate</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Candidate not found'}</p>
                <Button 
                  onClick={() => {
                    if (jobId) {
                      router.push(`/dashboard/job/${jobId}/shortlisted`)
                    } else {
                      router.push('/dashboard/jobs')
                    }
                  }}
                  className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
                >
                  Go Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Top Navigation */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <TopNavigation />
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 space-y-6">
        {/* Back Button and Breadcrumb */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={() => {
              if (!jobId) {
                console.error('Missing jobId for navigation')
                router.push('/dashboard/jobs')
                return
              }
              try {
                router.push(`/dashboard/job/${jobId}/shortlisted`)
              } catch (error) {
                console.error('Navigation error:', error)
                router.push('/dashboard/jobs')
              }
            }}
            className="flex items-center gap-2 bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Candidates
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Home className="w-4 h-4" />
            <span>/</span>
            <Briefcase className="w-4 h-4" />
            <span>Jobs</span>
            <span>/</span>
            <span>Candidate Details</span>
          </div>
        </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{cleanCandidateName(candidate.candidate_name)}</CardTitle>
              <CardDescription className="mt-1">{candidate.email}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {candidate.score !== null && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Score</div>
                  <div className="text-3xl font-bold text-[#2D2DDD] dark:text-white">
                    {Math.round(candidate.score)}
                  </div>
                </div>
              )}
              <Badge variant={getStatusVariant(candidate.status)}>
                {candidate.status}
              </Badge>
              {isShortlisted && (
                candidate.interview_status === 'SCHEDULED' || candidate.interview_time ? (
                  <Button 
                    disabled
                    className="bg-green-600 hover:bg-green-600 text-white shadow-none hover:shadow-none cursor-not-allowed"
                  >
                    Scheduled
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setIsModalOpen(true)}
                    className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
                  >
                    Schedule Interview
                  </Button>
                )
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* AI Reasoning */}
      <Card>
        <CardHeader>
          <CardTitle>AI Reasoning</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="whitespace-pre-wrap text-sm">
            {candidate.reasoning || 'No reasoning provided'}
          </div>
        </CardContent>
      </Card>

      {/* Resume Link */}
      {candidate.resume_url && (
        <Card>
          <CardHeader>
            <CardTitle>Curriculum Vitae(CV)</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#2D2DDD] text-white rounded-lg transition-transform hover:scale-105 active:scale-95 no-underline"
            >
              View CV
              <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
      )}

      <ScheduleInterviewModal
        isOpen={isModalOpen}
        candidate={candidate}
        meetingLink={meetingLink}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchCandidateDetail()
          setIsModalOpen(false)
        }}
      />
      </div>
    </div>
  )
}

