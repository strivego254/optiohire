'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScheduleInterviewModal } from '@/components/modals/ScheduleInterviewModal'
import { Loader2, ArrowLeft, ExternalLink, Home, Briefcase } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { TopNavigation } from '@/components/dashboard/top-navigation'

interface CandidateDetail {
  id: string
  candidate_name: string
  email: string
  score: number | null
  status: string
  interview_time: string | null
  interview_link: string | null
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

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/hr/candidates/${applicantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        if (response.status === 404) {
          throw new Error('Candidate not found')
        }
        throw new Error(errorData.error || 'Failed to fetch candidate details')
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

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/job-postings/${jobId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const job = await response.json()
        setMeetingLink(job.meeting_link || '')
      }
    } catch (err) {
      console.error('Failed to fetch meeting link:', err)
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SHORTLIST':
      case 'SHORTLISTED':
        return 'success'
      case 'FLAG':
      case 'FLAGGED':
        return 'warning'
      case 'REJECT':
      case 'REJECTED':
        return 'destructive'
      default:
        return 'info'
    }
  }

  const isShortlisted = candidate?.status.toUpperCase() === 'SHORTLIST' || candidate?.status.toUpperCase() === 'SHORTLISTED'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !candidate) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-500">{error || 'Candidate not found'}</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </CardContent>
        </Card>
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
            variant="ghost"
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
            className="flex items-center gap-2"
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
              <CardTitle className="text-2xl">{candidate.candidate_name}</CardTitle>
              <CardDescription className="mt-1">{candidate.email}</CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {candidate.score !== null && (
                <div className="text-right">
                  <div className="text-sm text-gray-500">Score</div>
                  <div className="text-3xl font-bold text-primary">
                    {Math.round(candidate.score)}
                  </div>
                </div>
              )}
              <Badge variant={getStatusVariant(candidate.status)}>
                {candidate.status}
              </Badge>
              {isShortlisted && (
                <Button onClick={() => setIsModalOpen(true)}>
                  Schedule Interview
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Parsed Resume */}
      <Card>
        <CardHeader>
          <CardTitle>Parsed Resume</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {candidate.parsed_resume && (
            <>
              {candidate.parsed_resume.skills && (
                <div>
                  <h3 className="font-semibold mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(candidate.parsed_resume.skills)
                      ? candidate.parsed_resume.skills.map((skill: string, idx: number) => (
                          <Badge key={idx} variant="outline">{skill}</Badge>
                        ))
                      : Object.entries(candidate.parsed_resume.skills).map(([key, value]: [string, any]) => (
                          <Badge key={key} variant="outline">{key}: {String(value)}</Badge>
                        ))}
                  </div>
                </div>
              )}

              {candidate.parsed_resume.experience && (
                <div>
                  <h3 className="font-semibold mb-2">Experience</h3>
                  <div className="space-y-2">
                    {Array.isArray(candidate.parsed_resume.experience)
                      ? candidate.parsed_resume.experience.map((exp: any, idx: number) => (
                          <div key={idx} className="border-l-2 pl-4">
                            <div className="font-medium">{exp.title || exp.position || 'Position'}</div>
                            <div className="text-sm text-gray-500">{exp.company || exp.employer || ''}</div>
                            {exp.duration && <div className="text-xs text-gray-400">{exp.duration}</div>}
                          </div>
                        ))
                      : <pre className="text-sm">{JSON.stringify(candidate.parsed_resume.experience, null, 2)}</pre>}
                  </div>
                </div>
              )}

              {candidate.parsed_resume.education && (
                <div>
                  <h3 className="font-semibold mb-2">Education</h3>
                  <div className="space-y-2">
                    {Array.isArray(candidate.parsed_resume.education)
                      ? candidate.parsed_resume.education.map((edu: any, idx: number) => (
                          <div key={idx} className="border-l-2 pl-4">
                            <div className="font-medium">{edu.degree || edu.school || 'Education'}</div>
                            {edu.institution && <div className="text-sm text-gray-500">{edu.institution}</div>}
                          </div>
                        ))
                      : <pre className="text-sm">{JSON.stringify(candidate.parsed_resume.education, null, 2)}</pre>}
                  </div>
                </div>
              )}

              {candidate.parsed_resume.links && (
                <div>
                  <h3 className="font-semibold mb-2">Links</h3>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(candidate.parsed_resume.links)
                      ? candidate.parsed_resume.links.map((link: string, idx: number) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {link}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))
                      : Object.entries(candidate.parsed_resume.links).map(([key, value]: [string, any]) => (
                          <a
                            key={key}
                            href={String(value)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1"
                          >
                            {key}: {String(value)}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                  </div>
                </div>
              )}

              <details className="mt-4">
                <summary className="cursor-pointer font-semibold">Full JSON</summary>
                <pre className="mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto">
                  {JSON.stringify(candidate.parsed_resume, null, 2)}
                </pre>
              </details>
            </>
          )}
        </CardContent>
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
            <CardTitle>Resume</CardTitle>
          </CardHeader>
          <CardContent>
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-2"
            >
              View Resume
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

