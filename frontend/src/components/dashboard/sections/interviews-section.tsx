'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Video, ExternalLink, Loader2, MapPin, User } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { JobPosting } from '@/types'

interface InterviewData extends JobPosting {
  interview_date?: string
  google_calendar_link?: string
  applicantCount: number
  upcomingInterviews: number
  applicantStats: {
    total: number
    shortlisted: number
    flagged: number
    rejected: number
    pending: number
  }
}

export function InterviewsSection() {
  const { user } = useAuth()
  const [interviews, setInterviews] = useState<InterviewData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadInterviews = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        
        const token = localStorage.getItem('token')
        if (!token) {
          setIsLoading(false)
          return
        }

        // Fetch scheduled interviews from API
        const response = await fetch('/api/interviews', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          // If endpoint doesn't exist yet, return empty array
          if (response.status === 404) {
            setInterviews([])
            setIsLoading(false)
            return
          }
          setInterviews([])
          setIsLoading(false)
          return
        }

        const data = await response.json()
        const scheduledInterviews = data.interviews || []
        
        // Transform scheduled interviews to InterviewData format
        const interviewsData: InterviewData[] = scheduledInterviews.map((interview: any) => ({
          id: interview.id,
          job_title: interview.jobTitle,
          status: 'active',
          interview_date: interview.interviewTime,
          meeting_link: interview.interviewLink,
          google_calendar_link: interview.interviewLink,
          applicantCount: 1,
          upcomingInterviews: 1,
          candidateName: interview.candidateName,
          candidateEmail: interview.candidateEmail,
          applicantStats: {
            total: 1,
            shortlisted: 1,
            flagged: 0,
            rejected: 0,
            pending: 0
          }
        }))
        
        setInterviews(interviewsData)
      } catch (err) {
        console.error('Error loading interviews:', err)
        setError('Failed to load interview data')
        setInterviews([])
      } finally {
        setIsLoading(false)
      }
    }
    
    loadInterviews()
    
    // Refresh every 30 seconds
    const interval = setInterval(loadInterviews, 30000)
    return () => clearInterval(interval)
  }, [user])

  const formatInterviewDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUpcoming: date > new Date(),
      isToday: date.toDateString() === new Date().toDateString()
    }
  }

  const upcomingInterviews = interviews.filter(interview => 
    interview.interview_date && new Date(interview.interview_date) > new Date()
  )

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 text-gray-900 dark:text-white">
          Interviews
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          View and manage scheduled interviews
        </p>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-12"
        >
          <div className="text-center">
            <Loader2 className="animate-spin-smooth rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading interview schedule...</p>
          </div>
        </motion.div>
      )}

      {/* Interview Summary */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl font-figtree font-semibold flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#2D2DDD]" />
                Interview Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#2D2DDD] flex items-center justify-center mx-auto mb-3">
                    <Calendar className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-figtree font-medium mb-1 text-gray-900 dark:text-white">Total Interviews</h3>
                  <p className="text-xl font-bold text-[#2D2DDD] dark:text-white font-figtree">{interviews.length}</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-[#2D2DDD] flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-sm font-figtree font-medium mb-1 text-gray-900 dark:text-white">Upcoming</h3>
                  <p className="text-xl font-bold text-[#2D2DDD] dark:text-white font-figtree">{upcomingInterviews.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Upcoming Interviews */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#2D2DDD]" />
                Upcoming Interviews
              </CardTitle>
              <CardDescription>
                Scheduled interviews for your active job postings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingInterviews.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming interviews</h3>
                  <p className="text-muted-foreground mb-6">
                    Interviews will appear here when you schedule them for your job postings
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingInterviews.map((interview, index) => {
                    if (!interview.interview_date) return null
                    const dateInfo = formatInterviewDate(interview.interview_date)
                    return (
                      <motion.div
                        key={interview.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                      >
                        <Card className="hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold font-figtree">{interview.job_title}</h3>
                                  <Badge variant={dateInfo.isToday ? 'warning' : 'success'}>
                                    {dateInfo.isToday ? 'Today' : 'Upcoming'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-6 text-sm text-muted-foreground font-figtree font-light mb-3">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {dateInfo.date} at {dateInfo.time}
                                  </div>
                                  {(interview as any).candidateName && (
                                    <div className="flex items-center gap-1">
                                      <User className="w-4 h-4" />
                                      {(interview as any).candidateName}
                                    </div>
                                  )}
                                </div>
                                {(interview as any).candidateEmail && (
                                  <p className="text-sm text-muted-foreground font-figtree font-light">
                                    {(interview as any).candidateEmail}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-4 sm:mt-0">
                                {interview.meeting_link && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(interview.meeting_link!, '_blank')}
                                    className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD] hover:border-[#2D2DDD] dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD] w-full sm:w-auto shadow-none hover:shadow-none"
                                  >
                                    <Video className="w-4 h-4 mr-1" />
                                    Join Meeting
                                  </Button>
                                )}
                                {interview.google_calendar_link && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => interview.google_calendar_link && window.open(interview.google_calendar_link, '_blank')}
                                    className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD] hover:border-[#2D2DDD] dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD] w-full sm:w-auto shadow-none hover:shadow-none"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Calendar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}
