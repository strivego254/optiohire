'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MetricCard } from '../metric-card'
import { 
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  Loader2,
  Briefcase,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronDown,
  Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useAnalyticsRealtime, useJobsRealtime } from '@/hooks/use-realtime-data'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  ApplicantMetricsSlice,
  EMPTY_APPLICANT_METRICS,
  combineApplicantMetrics,
  deriveMetricsFromApplicantStatuses,
  extractApplicantMetrics,
  hasApplicantMetricsData,
} from '@/utils/analytics'

interface DashboardMetrics {
  activeJobs: number
  totalJobs: number
  totalReports: number
  readyReports: number
  totalApplicants: number
  shortlistedApplicants: number
  flaggedApplicants: number
  rejectedApplicants: number
}

type JobPostingRow = Database['public']['Tables']['job_postings']['Row']

interface JobPosting {
  id: string
  job_title: string
  status: JobPostingRow['status']
}

const ANALYTICS_SELECT_COLUMNS =
  'total_applicants,total_applicants_shortlisted,total_shortlisted,total_applicants_rejected,total_rejected,total_applicants_flagged_to_hr,total_flagged'

const mergeApplicantMetrics = (
  previous: DashboardMetrics,
  slice: ApplicantMetricsSlice
): DashboardMetrics => ({
  ...previous,
  totalApplicants: slice.totalApplicants,
  shortlistedApplicants: slice.shortlistedApplicants,
  rejectedApplicants: slice.rejectedApplicants,
  flaggedApplicants: slice.flaggedApplicants,
})

const fetchApplicantFallbackMetrics = async (jobId: string) => {
  const { data: applicants, error: applicantsError } = await supabase
    .from('applicants')
    .select('status')
    .eq('job_posting_id', jobId)

  if (!applicantsError && applicants) {
    return deriveMetricsFromApplicantStatuses(applicants)
  }

  return { ...EMPTY_APPLICANT_METRICS }
}

const fetchApplicantsAggregateForJobs = async (jobIds: string[]) => {
  const { data: applicants, error: applicantsError } = await supabase
    .from('applicants')
    .select('status')
    .in('job_posting_id', jobIds)

  if (!applicantsError && applicants) {
    return deriveMetricsFromApplicantStatuses(applicants)
  }

  return { ...EMPTY_APPLICANT_METRICS }
}

export function OverviewSection() {
  const { user } = useAuth()
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    activeJobs: 0,
    totalJobs: 0,
    totalReports: 0,
    readyReports: 0,
    totalApplicants: 0,
    shortlistedApplicants: 0,
    flaggedApplicants: 0,
    rejectedApplicants: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([])
  const [selectedJobId, setSelectedJobId] = useState<string | 'all'>('all')
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)

  // Load job-specific analytics - simplified to skip Supabase stub calls
  const loadJobAnalytics = useCallback(async (jobId: string, options?: { skipLoadingState?: boolean }) => {
    if (!user || !jobId) return
    
    // Skip analytics loading for now to improve performance
    // Supabase is a stub and returns empty data anyway
    setIsLoadingAnalytics(false)
  }, [user])

  // Load analytics for all jobs - simplified to skip Supabase stub calls
  const loadAllJobsAnalytics = useCallback(async (jobIds: string[], options?: { skipLoadingState?: boolean }) => {
    if (!user || jobIds.length === 0) return
    
    // Skip analytics loading for now to improve performance
    // Supabase is a stub and returns empty data anyway
    setIsLoadingAnalytics(false)
  }, [user])

  const loadDashboardMetrics = useCallback(async () => {
    if (!user) {
      setIsLoading(false)
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Fetch jobs from backend API
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      // Fetch jobs from backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/job-postings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      let jobs: any[] = []
      if (response.ok) {
        const data = await response.json()
        jobs = data.jobs || []
      } else if (response.status === 404) {
        // No company found or no jobs - this is okay, just show empty state
        jobs = []
      } else {
        console.error('Failed to fetch jobs:', response.status, await response.text().catch(() => ''))
        // Continue with empty array rather than showing error
        jobs = []
      }
      
      // Normalize jobs data - handle both backend format and Supabase format
      const normalizedJobs: JobPosting[] = (jobs ?? [])
        .filter((job: any) => job && (job.id || job.job_posting_id || job.job_id))
        .map((job: any) => ({
          id: job.id || job.job_posting_id || job.job_id,
          job_title: job.job_title || job.title || 'Untitled Job',
          status: job.status || 'ACTIVE',
        }))
      
      setJobPostings(normalizedJobs)
      
      const activeJob = normalizedJobs.find(job => job.status === 'active' || job.status === 'ACTIVE')
      const fallbackJobId = normalizedJobs[0]?.id ?? 'all'
      const resolvedSelection =
        (selectedJobId !== 'all' && normalizedJobs.some(job => job.id === selectedJobId))
          ? selectedJobId
          : (activeJob?.id ?? fallbackJobId)
      
      setSelectedJobId(resolvedSelection)
      
      const activeJobs = normalizedJobs.filter(job => job.status === 'active' || job.status === 'ACTIVE').length
      const totalJobs = normalizedJobs.length
      
      // Calculate applicant metrics from jobs data
      let totalApplicants = 0
      let shortlistedApplicants = 0
      let flaggedApplicants = 0
      let rejectedApplicants = 0
      
      jobs.forEach((job: any) => {
        totalApplicants += job.applicant_count || 0
        shortlistedApplicants += job.shortlisted_count || 0
        flaggedApplicants += job.flagged_count || 0
        rejectedApplicants += job.rejected_count || 0
      })
      
      // Set metrics with actual data
      setMetrics({
        activeJobs,
        totalJobs,
        totalReports: 0,
        readyReports: 0,
        totalApplicants,
        shortlistedApplicants,
        flaggedApplicants,
        rejectedApplicants,
      })

      // Skip analytics loading if no jobs
      setIsLoadingAnalytics(false)
    } catch (err) {
      console.error('Error loading dashboard metrics:', err)
      setError('Failed to load dashboard metrics')
    } finally {
      setIsLoading(false)
    }
  }, [loadAllJobsAnalytics, loadJobAnalytics, selectedJobId, user])

  // Handle job selection change
  const handleJobSelect = (jobId: string | 'all') => {
    setSelectedJobId(jobId)
    setIsPopoverOpen(false)
    if (jobId === 'all') {
      // Get all job IDs for this company
      const jobIds = jobPostings.map(j => j.id)
      if (jobIds.length > 0) {
        loadAllJobsAnalytics(jobIds)
      }
    } else {
      loadJobAnalytics(jobId)
    }
  }

  // Load metrics on component mount - only once when user is available
  useEffect(() => {
    if (user) {
      loadDashboardMetrics()
    }
  }, [user]) // Removed loadDashboardMetrics from deps to prevent re-renders

  // Skip real-time subscriptions for now to reduce loading
  // They can be re-enabled later if needed
  // useAnalyticsRealtime(() => {
  //   console.log('Analytics data changed, refreshing metrics...')
  //   loadDashboardMetrics()
  // })

  // useJobsRealtime(() => {
  //   console.log('Jobs data changed, refreshing metrics...')
  //   loadDashboardMetrics()
  // })

  const metricsData = [
    {
      title: 'Active Jobs',
      value: metrics.activeJobs,
      icon: TrendingUp,
      trend: metrics.totalJobs > 0 ? { 
        value: metrics.totalJobs, 
        label: 'total jobs', 
        isPositive: true 
      } : undefined,
    },
    {
      title: 'Total Jobs',
      value: metrics.totalJobs,
      icon: Briefcase,
    },
    {
      title: 'Reports Generated',
      value: metrics.totalReports,
      icon: BarChart3,
      trend: metrics.totalReports > 0 ? { 
        value: metrics.readyReports, 
        label: 'ready', 
        isPositive: true 
      } : undefined,
    },
    {
      title: 'Ready Reports',
      value: metrics.readyReports,
      icon: CheckCircle,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Welcome Section with Job Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'tween', duration: 0.4, ease: 'easeOut' }}
        className="gpu-accelerated"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          {/* Welcome Section */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-2 text-gray-900 dark:text-white">
              Dashboard Overview
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Monitor your recruitment pipeline and track key metrics
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            <Button
              onClick={() => router.push('/dashboard/jobs')}
              className="bg-[#2D2DDD] hover:bg-[#2D2DDD]/90 text-white shadow-md hover:shadow-lg transition-all"
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
            {/* Job Selector Button */}
            <div>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading || jobPostings.length === 0}
                  className="h-10 min-w-[200px] max-w-[280px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-shadow"
                >
                  <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="max-w-[150px] truncate text-sm font-figtree font-medium">
                    {isLoading ? (
                      'Loading...'
                    ) : jobPostings.length === 0 ? (
                      'No Jobs Available'
                    ) : selectedJobId === 'all' ? (
                      'All Job Posts'
                    ) : (
                      jobPostings.find(j => j.id === selectedJobId)?.job_title || 'Select Job'
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              {jobPostings.length > 0 && (
                <PopoverContent className="w-72 p-2 z-[100]" align="end">
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => handleJobSelect('all')}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-md text-sm font-figtree transition-colors",
                        selectedJobId === 'all'
                          ? "bg-[#2D2DDD] text-white"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      )}
                    >
                      All Job Posts
                    </button>
                    {jobPostings.map((job) => (
                      <button
                        type="button"
                        key={job.id}
                        onClick={() => handleJobSelect(job.id)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm font-figtree transition-colors",
                          selectedJobId === job.id
                            ? "bg-[#2D2DDD] text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{job.job_title}</span>
                          {job.status === 'active' && (
                            <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded flex-shrink-0">
                              Active
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              )}
              </Popover>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg"
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
            <Loader2 className="animate-spin-smooth rounded-full h-8 w-8 border-b-2 border-[#2D2DDD] mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard metrics...</p>
          </div>
        </motion.div>
      )}

      {/* Metrics Grid */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {metricsData.map((metric, index) => (
            <MetricCard
              key={metric.title}
              title={metric.title}
              value={metric.value}
              icon={metric.icon}
              trend={metric.trend}
              delay={index * 0.1}
            />
          ))}
        </div>
      )}

      {/* Applicant Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', duration: 0.4, delay: 0.4, ease: 'easeOut' }}
          className="gpu-accelerated"
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader className="pb-4">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-figtree font-extralight flex items-center gap-3 text-gray-900 dark:text-white mb-2">
                <Users className="w-5 h-5 text-[#2D2DDD] flex-shrink-0" />
                Applicant Analytics Overview
              </CardTitle>
              <CardDescription className="text-sm font-figtree font-light text-gray-600 dark:text-gray-400">
                Comprehensive breakdown of your recruitment pipeline
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-figtree font-medium mb-1 text-gray-900 dark:text-white">Total Applicants</h3>
                {isLoadingAnalytics ? (
                  <Loader2 className="w-6 h-6 animate-spin text-[#2D2DDD] mx-auto my-2" />
                ) : (
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400 font-figtree">{metrics.totalApplicants}</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 font-figtree font-light">
                  {selectedJobId === 'all' ? 'Across all job postings' : 'For selected job'}
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center mx-auto mb-3">
                  <UserCheck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-figtree font-medium mb-1 text-gray-900 dark:text-white">Shortlisted</h3>
                {isLoadingAnalytics ? (
                  <Loader2 className="w-6 h-6 animate-spin text-green-600 dark:text-green-400 mx-auto my-2" />
                ) : (
                  <p className="text-xl font-bold text-green-600 dark:text-green-400 font-figtree">{metrics.shortlistedApplicants}</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 font-figtree font-light">
                  {metrics.totalApplicants > 0 ? Math.round((metrics.shortlistedApplicants / metrics.totalApplicants) * 100) : 0}% of total
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-figtree font-medium mb-1 text-gray-900 dark:text-white">Flagged</h3>
                {isLoadingAnalytics ? (
                  <Loader2 className="w-6 h-6 animate-spin text-yellow-600 dark:text-yellow-400 mx-auto my-2" />
                ) : (
                  <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400 font-figtree">{metrics.flaggedApplicants}</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 font-figtree font-light">
                  Require review
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center mx-auto mb-3">
                  <UserX className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-base font-figtree font-medium mb-1 text-gray-900 dark:text-white">Rejected</h3>
                {isLoadingAnalytics ? (
                  <Loader2 className="w-6 h-6 animate-spin text-red-600 dark:text-red-400 mx-auto my-2" />
                ) : (
                  <p className="text-xl font-bold text-red-600 dark:text-red-400 font-figtree">{metrics.rejectedApplicants}</p>
                )}
                <p className="text-xs text-gray-600 dark:text-gray-400 font-figtree font-light">
                  {metrics.totalApplicants > 0 ? Math.round((metrics.rejectedApplicants / metrics.totalApplicants) * 100) : 0}% of total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
          <CardHeader>
            <CardTitle className="text-lg font-figtree font-extralight flex items-center gap-3 text-gray-900 dark:text-white">
              <BarChart3 className="w-4 h-4 text-[#2D2DDD]" />
              Quick Actions
            </CardTitle>
            <CardDescription className="text-sm font-figtree font-light text-gray-600 dark:text-gray-400">
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/dashboard/jobs')}
                className="group"
              >
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#2D2DDD] dark:hover:border-[#2D2DDD]">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2D2DDD] to-[#2D2DDD]/70 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <Briefcase className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">Manage Jobs</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View and edit job postings
                    </p>
                  </CardContent>
                </Card>
              </button>
              <button
                onClick={() => {
                  if (jobPostings.length > 0) {
                    router.push(`/dashboard/job/${jobPostings[0].id}/shortlisted`)
                  } else {
                    router.push('/dashboard/jobs')
                  }
                }}
                className="group"
              >
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#2D2DDD] dark:hover:border-[#2D2DDD]">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">View Candidates</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Manage applicants and candidates
                    </p>
                  </CardContent>
                </Card>
              </button>
              <button
                onClick={() => router.push('/dashboard/reports')}
                className="group"
              >
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#2D2DDD] dark:hover:border-[#2D2DDD]">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">View Reports</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Analytics and insights
                    </p>
                  </CardContent>
                </Card>
              </button>
              <button
                onClick={() => router.push('/dashboard/jobs')}
                className="group"
              >
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer h-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-[#2D2DDD] dark:hover:border-[#2D2DDD]">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-gray-900 dark:text-white">Post New Job</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Create new positions
                    </p>
                  </CardContent>
                </Card>
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
