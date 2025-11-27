'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScheduleInterviewModal } from '@/components/modals/ScheduleInterviewModal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, Trophy, Medal, Award, User, ArrowLeft, Home, Briefcase, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { TopNavigation } from '@/components/dashboard/top-navigation'
import type { Candidate as CandidateRowType } from '@/components/CandidateRow'
import { cleanCandidateName } from '@/lib/utils'

interface Candidate extends CandidateRowType {
  rank?: number
  reasoning?: string | null
}

export default function ShortlistedPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string
  const { user, loading: authLoading } = useAuth()

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [meetingLink, setMeetingLink] = useState<string>('')

  // STRICT: Admin should NOT access HR dashboard
  useEffect(() => {
    if (authLoading) return
    if (user && user.role === 'admin') {
      router.push('/admin')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user || user.role === 'admin') return
    if (!jobId) {
      setError('Invalid job ID')
      setLoading(false)
      return
    }
    fetchCandidates()
    fetchMeetingLink()
  }, [jobId, user])

  const fetchCandidates = async () => {
    try {
      setLoading(true)
      setError(null)
      
      if (!jobId) {
        throw new Error('Invalid job ID')
      }
      
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Use frontend API route instead of direct backend call
      const response = await fetch(`/api/hr/candidates?jobId=${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch candidates')
      }

      const data = await response.json()
      setCandidates(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error('Error fetching candidates:', err)
      setError(err.message || 'Failed to load candidates')
      setCandidates([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMeetingLink = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      // Fetch job posting to get meeting link using frontend API
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

  const handleScheduleClick = (candidate: Candidate) => {
    setSelectedCandidate(candidate)
    setIsModalOpen(true)
  }

  const handleRowClick = (candidate: Candidate) => {
    if (!jobId || !candidate?.id) {
      console.error('Missing jobId or candidate.id for navigation')
      return
    }
    try {
      router.push(`/dashboard/job/${jobId}/candidate/${candidate.id}`)
    } catch (error) {
      console.error('Navigation error:', error)
      setError('Failed to navigate to candidate details')
    }
  }

  const handleScheduleSuccess = () => {
    fetchCandidates()
  }

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
            <p className="text-gray-600 dark:text-gray-400">Loading candidates...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
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
                <p className="text-red-500 text-lg font-semibold mb-2">Failed to load candidates</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
                <Button 
                  onClick={fetchCandidates} 
                  className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
                >
              Retry
            </Button>
              </div>
          </CardContent>
        </Card>
        </div>
      </div>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
    if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />
    return <span className="text-sm font-semibold text-gray-600">#{rank}</span>
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: 'shortlisted' | 'flagged' | 'rejected' | 'outline', label: string }> = {
      'SHORTLIST': { variant: 'shortlisted', label: 'Shortlisted' },
      'SHORTLISTED': { variant: 'shortlisted', label: 'Shortlisted' },
      'FLAG': { variant: 'flagged', label: 'Flagged' },
      'FLAGGED': { variant: 'flagged', label: 'Flagged' },
      'REJECT': { variant: 'rejected', label: 'Rejected' },
      'REJECTED': { variant: 'rejected', label: 'Rejected' },
      'PENDING': { variant: 'outline', label: 'Pending' },
    }
    const statusInfo = statusMap[status.toUpperCase()] || statusMap['PENDING']
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  const truncateReasoning = (reasoning: string | null | undefined, maxLength: number = 100) => {
    if (!reasoning) return 'No reasoning provided'
    if (reasoning.length <= maxLength) return reasoning
    return reasoning.substring(0, maxLength) + '...'
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
              try {
                router.push('/dashboard/jobs')
              } catch (error) {
                console.error('Navigation error:', error)
              }
            }}
            className="flex items-center gap-2 bg-[#2D2DDD] text-white hover:bg-[#2D2DDD] hover:text-white shadow-none hover:shadow-none"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Jobs
          </Button>
          
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Home className="w-4 h-4" />
            <span>/</span>
            <Briefcase className="w-4 h-4" />
            <span>Jobs</span>
            <span>/</span>
            <span>Candidates</span>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Candidates List
            </CardTitle>
          </CardHeader>
        <CardContent>
          <div 
            className="overflow-x-auto [&::-webkit-scrollbar]:h-[2px] [&::-webkit-scrollbar]:w-[2px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#2D2DDD] [&::-webkit-scrollbar-thumb]:rounded-full"
            style={{
              scrollbarWidth: 'thin',
              scrollbarColor: '#2D2DDD transparent'
            }}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Rank</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-24 text-center">Score</TableHead>
                  <TableHead className="w-32">Status</TableHead>
                  <TableHead className="min-w-[200px]">Score Reason</TableHead>
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                      No candidates yet on the job post
                    </TableCell>
                  </TableRow>
                ) : (
                  candidates.map((candidate) => (
                    <TableRow 
                      key={candidate.id}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => handleRowClick(candidate)}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center">
                          {candidate.rank ? getRankIcon(candidate.rank) : '-'}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {cleanCandidateName(candidate.candidate_name)}
                      </TableCell>
                      <TableCell className="text-gray-600 dark:text-gray-400">
                        {candidate.email}
                      </TableCell>
                      <TableCell className="text-center">
                        {candidate.score !== null && candidate.score !== undefined && typeof candidate.score === 'number' ? (
                          <span className="font-semibold text-[#2D2DDD] dark:text-white">
                            {Number(candidate.score).toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(candidate.status)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="line-clamp-2" title={candidate.reasoning || ''}>
                          {truncateReasoning(candidate.reasoning)}
                        </p>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {candidate.status === 'SHORTLIST' && (
                          candidate.interview_status === 'SCHEDULED' || candidate.interview_time ? (
                            <Button
                              size="sm"
                              disabled
                              className="bg-green-600 hover:bg-green-600 text-white shadow-none hover:shadow-none cursor-not-allowed"
                            >
                              Scheduled
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleScheduleClick(candidate)}
                              className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
                            >
                              Schedule
                            </Button>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ScheduleInterviewModal
        isOpen={isModalOpen}
        candidate={selectedCandidate}
        meetingLink={meetingLink}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedCandidate(null)
        }}
        onSuccess={handleScheduleSuccess}
      />
      </div>
    </div>
  )
}

