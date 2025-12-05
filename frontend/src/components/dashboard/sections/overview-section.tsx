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
import { useAuth } from '@/hooks/use-auth'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
// Removed unused imports: supabase, Database, useAnalyticsRealtime, useJobsRealtime
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useNotifications } from '@/contexts/notification-context'
import {
  ApplicantMetricsSlice,
  EMPTY_APPLICANT_METRICS,
} from '@/utils/analytics'
import { ProductTour, TourStep } from '@/components/ui/product-tour'
import { Sparkles } from 'lucide-react'

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

type JobPostingRow = {
  job_posting_id: string
  job_title: string
  status: string | null
  [key: string]: any
}

interface JobPosting {
  id: string
  job_title: string
  status: JobPostingRow['status']
}

// Removed unused constants and functions

// Removed Supabase fallback functions - using API routes instead
const fetchApplicantFallbackMetrics = async (jobId: string) => {
  // This function is no longer used - metrics come from API
  return { ...EMPTY_APPLICANT_METRICS }
}

const fetchApplicantsAggregateForJobs = async (jobIds: string[]) => {
  // This function is no longer used - metrics come from API
  return { ...EMPTY_APPLICANT_METRICS }
}

export function OverviewSection() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { addNotification } = useNotifications()
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
  const [allJobsData, setAllJobsData] = useState<any[]>([]) // Store full job data with applicant counts
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false)
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const [selectedJobData, setSelectedJobData] = useState<any>(null)
  const [isTourOpen, setIsTourOpen] = useState(false)

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

  const loadDashboardMetrics = useCallback(async (currentSelectedJobId: string | null = null, preserveSelection: boolean = false) => {
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

      // Fetch jobs from frontend API route
      const response = await fetch('/api/job-postings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      let jobs: any[] = []
      let reportsData = { totalReports: 0, readyReports: 0 }
      if (response.ok) {
        const data = await response.json()
        jobs = data.jobs || []
        reportsData = data.reports || { totalReports: 0, readyReports: 0 }
      } else if (response.status === 404) {
        // No company found or no jobs - this is okay, just show empty state
        jobs = []
      } else {
        console.error('Failed to fetch jobs:', response.status, await response.text().catch(() => ''))
        // Continue with empty array rather than showing error
        jobs = []
      }
      
      // Normalize jobs data - handle both backend format and Supabase format
      // Also normalize IDs in the full jobs data for consistent matching
      const normalizedJobs: JobPosting[] = (jobs ?? [])
        .filter((job: any) => job && (job.id || job.job_posting_id || job.job_id))
        .map((job: any) => ({
          id: String(job.id || job.job_posting_id || job.job_id), // Normalize to string
          job_title: job.job_title || job.title || 'Untitled Job',
          status: job.status || 'ACTIVE',
        }))
      
      // Store full jobs data with normalized IDs for quick switching
      const normalizedJobsData = jobs.map((job: any) => ({
        ...job,
        id: String(job.id || job.job_posting_id || job.job_id), // Ensure consistent ID field as string
        job_posting_id: String(job.id || job.job_posting_id || job.job_id), // Also set job_posting_id for compatibility
      }))
      setAllJobsData(normalizedJobsData)
      
      setJobPostings(normalizedJobs)
      
      // Determine which job to select
      let resolvedSelection: string | null = null
      if (preserveSelection && currentSelectedJobId) {
        // Use the explicitly provided job ID
        resolvedSelection = String(currentSelectedJobId)
      } else if (!preserveSelection) {
        // Default to most recently created job (first in array since API orders by created_at DESC)
        resolvedSelection = normalizedJobs[0]?.id ? String(normalizedJobs[0].id) : null
      } else {
        // When preserveSelection is true but no currentSelectedJobId, use current selectedJobId from state
        // We need to read it from a ref or pass it differently, but for now use the state
        // Actually, if preserveSelection is true, we should have currentSelectedJobId
        resolvedSelection = normalizedJobs[0]?.id ? String(normalizedJobs[0].id) : null
      }
      
      setSelectedJobId(resolvedSelection)
      
      // Find the selected job's data from the jobs array
      const selectedJob = normalizedJobsData.find((job: any) => 
        String(job.id) === String(resolvedSelection) || 
        String(job.job_posting_id) === String(resolvedSelection)
      )
      setSelectedJobData(selectedJob || null)
      
      // Calculate metrics for ALL jobs (for the "Total Jobs" and "Active Jobs" cards)
      const activeJobs = normalizedJobs.filter(job => {
        const status = String(job.status || '').toUpperCase()
        return status === 'ACTIVE'
      }).length
      const totalJobs = normalizedJobs.length
      
      // Calculate applicant metrics ONLY for the selected job
      const jobApplicants = selectedJob ? {
        totalApplicants: Number(selectedJob.applicant_count || 0),
        shortlistedApplicants: Number(selectedJob.shortlisted_count || 0),
        flaggedApplicants: Number(selectedJob.flagged_count || 0),
        rejectedApplicants: Number(selectedJob.rejected_count || 0),
      } : {
        totalApplicants: 0,
        shortlistedApplicants: 0,
        flaggedApplicants: 0,
        rejectedApplicants: 0,
      }
      
      // Set metrics with selected job's data
      setMetrics({
        activeJobs,
        totalJobs,
        totalReports: reportsData.totalReports,
        readyReports: reportsData.readyReports,
        ...jobApplicants,
      })

      // Show success notification if jobs were loaded
      if (normalizedJobs.length > 0 && !preserveSelection) {
        addNotification({
          title: 'Dashboard updated',
          description: `Loaded ${normalizedJobs.length} job${normalizedJobs.length !== 1 ? 's' : ''} successfully`,
          type: 'success',
        })
        
        toast({
          title: 'Dashboard updated',
          description: `Loaded ${normalizedJobs.length} job${normalizedJobs.length !== 1 ? 's' : ''} successfully`,
          variant: 'success',
        })
      }

      // Skip analytics loading if no jobs
      setIsLoadingAnalytics(false)
    } catch (err) {
      console.error('Error loading dashboard metrics:', err)
      setError('Failed to load dashboard metrics')
      
      addNotification({
        title: 'Error loading dashboard',
        description: err instanceof Error ? err.message : 'Failed to load dashboard metrics. Please try again.',
        type: 'error',
      })
      
      toast({
        title: 'Error loading dashboard',
        description: err instanceof Error ? err.message : 'Failed to load dashboard metrics. Please try again.',
        variant: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, toast]) // Removed selectedJobId from dependencies to prevent re-runs on selection change

  // Handle job selection change
  const handleJobSelect = useCallback((jobId: string) => {
    if (!jobId) {
      console.warn('handleJobSelect called with empty jobId')
      return
    }
    
    console.log('Switching to job:', jobId, 'Available jobs:', allJobsData.length)
    setIsPopoverOpen(false)
    
    // Normalize the jobId to string for consistent matching
    const normalizedJobId = String(jobId)
    
    // If no jobs data loaded yet, wait for it to load
    if (allJobsData.length === 0) {
      console.log('Jobs data not loaded yet, loading...')
      // Set the selection and let loadDashboardMetrics handle it
      loadDashboardMetrics(normalizedJobId, true)
      return
    }
    
    // Find the selected job's data from already-loaded jobs
    // Jobs in allJobsData now have normalized IDs as strings
    const selectedJob = allJobsData.find((job: any) => {
      const jobIdValue = String(job.id || job.job_posting_id || job.job_id)
      return jobIdValue === normalizedJobId
    })
    
    if (selectedJob) {
      console.log('Found job in cache, updating metrics:', {
        jobId: normalizedJobId,
        applicant_count: selectedJob.applicant_count,
        shortlisted_count: selectedJob.shortlisted_count,
        flagged_count: selectedJob.flagged_count,
        rejected_count: selectedJob.rejected_count
      })
      
      // Update state immediately for instant UI feedback
      setSelectedJobId(normalizedJobId)
      setSelectedJobData(selectedJob)
      
      // Update metrics with selected job's data immediately
      const jobApplicants = {
        totalApplicants: Number(selectedJob.applicant_count || 0),
        shortlistedApplicants: Number(selectedJob.shortlisted_count || 0),
        flaggedApplicants: Number(selectedJob.flagged_count || 0),
        rejectedApplicants: Number(selectedJob.rejected_count || 0),
      }
      
      setMetrics(prev => ({
        ...prev,
        ...jobApplicants,
      }))
      
      // Show notification when job is selected
      addNotification({
        title: 'Job selected',
        description: `Viewing analytics for "${selectedJob.job_title}"`,
        type: 'info',
      })
      
      toast({
        title: 'Job selected',
        description: `Viewing analytics for "${selectedJob.job_title}"`,
        variant: 'info',
      })
      
      loadJobAnalytics(normalizedJobId)
    } else {
      // If job not found in cached data, refresh from API
      console.warn('Job not found in cached data, refreshing from API...', {
        jobId: normalizedJobId,
        allJobsDataLength: allJobsData.length,
        availableJobIds: allJobsData.map(j => String(j.id || j.job_posting_id || j.job_id))
      })
      // Refresh and select the job
      loadDashboardMetrics(normalizedJobId, true)
    }
  }, [allJobsData, loadJobAnalytics, loadDashboardMetrics])



  // Load metrics on component mount
  useEffect(() => {
    if (user) {
      loadDashboardMetrics(null, false) // Don't preserve selection on initial load
    }
  }, [user, loadDashboardMetrics])

  // Refresh job data when needed (e.g., after creating a new job)
  const refreshJobData = useCallback(async () => {
    if (!user) return
    
    const token = localStorage.getItem('token')
    if (!token) return
    
    try {
      const response = await fetch('/api/job-postings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        const jobs = data.jobs || []
        const reportsData = data.reports || { totalReports: 0, readyReports: 0 }
        setAllJobsData(jobs)
        
        // Update selected job data if it exists
        if (selectedJobId) {
          const selectedJob = jobs.find((job: any) => 
            (job.id || job.job_posting_id || job.job_id) === selectedJobId
          )
          if (selectedJob) {
            setSelectedJobData(selectedJob)
            // Update metrics
            setMetrics(prev => ({
              ...prev,
              totalReports: reportsData.totalReports,
              readyReports: reportsData.readyReports,
              totalApplicants: selectedJob.applicant_count || 0,
              shortlistedApplicants: selectedJob.shortlisted_count || 0,
              flaggedApplicants: selectedJob.flagged_count || 0,
              rejectedApplicants: selectedJob.rejected_count || 0,
            }))
          }
        } else {
          // Update reports even if no job selected
          setMetrics(prev => ({
            ...prev,
            totalReports: reportsData.totalReports,
            readyReports: reportsData.readyReports,
          }))
        }
      }
    } catch (err) {
      console.error('Error refreshing job data:', err)
    }
  }, [user, selectedJobId])

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

  const tourSteps: TourStep[] = [
    {
      id: 'dashboard-overview-title',
      target: '[data-tour="dashboard-overview-title"]',
      title: 'Dashboard Overview',
      content: 'Welcome to your recruitment dashboard! This section provides a comprehensive view of your hiring pipeline and key performance metrics.',
      position: 'bottom',
    },
    {
      id: 'job-selector',
      target: '[data-tour="job-selector"]',
      title: 'Job Post Selector',
      content: 'Use this dropdown to select a specific job posting and view its detailed analytics. The metrics below will update based on your selection.',
      position: 'bottom',
    },
    {
      id: 'active-jobs',
      target: '[data-tour="active-jobs"]',
      title: 'Active Jobs',
      content: 'This metric shows the number of currently active job postings. Active jobs are open for applications and visible to candidates.',
      position: 'bottom',
    },
    {
      id: 'total-jobs',
      target: '[data-tour="total-jobs"]',
      title: 'Total Jobs',
      content: 'View the total number of job postings you have created, including both active and inactive positions.',
      position: 'bottom',
    },
    {
      id: 'reports-generated',
      target: '[data-tour="reports-generated"]',
      title: 'Reports Generated',
      content: 'Track the total number of analytics reports that have been generated for your recruitment activities.',
      position: 'bottom',
    },
    {
      id: 'ready-reports',
      target: '[data-tour="ready-reports"]',
      title: 'Ready Reports',
      content: 'See how many reports are ready for review. These reports contain insights about your hiring process and candidate analytics.',
      position: 'bottom',
    },
    {
      id: 'applicant-analytics-title',
      target: '[data-tour="applicant-analytics-title"]',
      title: 'Applicant Analytics Overview',
      content: 'This section provides a detailed breakdown of applicant statuses for the selected job posting. Monitor your recruitment pipeline at a glance.',
      position: 'bottom',
    },
    {
      id: 'total-applicants',
      target: '[data-tour="total-applicants"]',
      title: 'Total Applicants',
      content: 'The total number of applicants who have applied for the selected job posting. This metric updates based on your job selection.',
      position: 'top',
    },
    {
      id: 'shortlisted',
      target: '[data-tour="shortlisted"]',
      title: 'Shortlisted Candidates',
      content: 'Candidates who have been shortlisted for further review. The percentage shows what portion of total applicants are shortlisted.',
      position: 'top',
    },
    {
      id: 'flagged',
      target: '[data-tour="flagged"]',
      title: 'Flagged Applicants',
      content: 'Applicants that require your attention or review. These candidates may need additional screening or have specific concerns.',
      position: 'top',
    },
    {
      id: 'rejected',
      target: '[data-tour="rejected"]',
      title: 'Rejected Applicants',
      content: 'The number of applicants who have been rejected. The percentage indicates what portion of total applicants were not selected.',
      position: 'top',
    },
  ]

  return (
    <div className="space-y-8">
      <ProductTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={() => {
          setIsTourOpen(false)
          addNotification({
            title: 'Tour completed',
            description: 'You\'ve completed the dashboard overview tour!',
            type: 'success',
          })
        }}
      />
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
            <div className="flex items-center gap-3 mb-2">
              <h1 
                data-tour="dashboard-overview-title"
                className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white"
              >
                Dashboard Overview
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTourOpen(true)}
                className="h-8 px-3 text-xs text-[#2D2DDD] hover:text-[#2424c0] hover:bg-[#2D2DDD]/10 border border-[#2D2DDD]/20 rounded-lg transition-all"
                aria-label="Start product tour"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Take Tour
              </Button>
            </div>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              Monitor your recruitment pipeline and track key metrics
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
            {/* Job Selector Button */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Select Job Post to View Analytics
              </label>
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  data-tour="job-selector"
                  type="button"
                  variant="outline"
                  disabled={isLoading || jobPostings.length === 0}
                  className="h-10 min-w-[200px] max-w-[280px] border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 hover:!text-gray-900 dark:hover:!text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transition-shadow"
                >
                  <Briefcase className="w-4 h-4 mr-2 flex-shrink-0" />
                  <span className="max-w-[150px] truncate text-sm font-figtree font-medium">
                    {isLoading ? (
                      'Loading...'
                    ) : jobPostings.length === 0 ? (
                      'No Jobs Available'
                    ) : (
                      jobPostings.find(j => String(j.id) === String(selectedJobId))?.job_title || 'Select Job'
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              {jobPostings.length > 0 && (
                <PopoverContent className="w-72 p-2 z-[100]" align="end">
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {jobPostings.map((job) => (
                      <button
                        type="button"
                        key={job.id}
                        onClick={() => {
                          console.log('Dropdown clicked for job:', job.id, 'Title:', job.job_title)
                          handleJobSelect(String(job.id))
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm font-figtree transition-colors",
                          String(selectedJobId) === String(job.id)
                            ? "bg-[#2D2DDD] text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{job.job_title}</span>
                          {(job.status?.toUpperCase() === 'ACTIVE' || job.status === 'active') && (
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
          {metricsData.map((metric, index) => {
            const tourId = metric.title === 'Active Jobs' ? 'active-jobs' :
                          metric.title === 'Total Jobs' ? 'total-jobs' :
                          metric.title === 'Reports Generated' ? 'reports-generated' :
                          metric.title === 'Ready Reports' ? 'ready-reports' : null
            
            return (
              <div key={metric.title} data-tour={tourId || undefined}>
                <MetricCard
                  title={metric.title}
                  value={metric.value}
                  icon={metric.icon}
                  trend={metric.trend}
                  delay={index * 0.1}
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Applicant Analytics Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'tween', duration: 0.4, delay: 0.4, ease: 'easeOut' }}
          className="gpu-accelerated"
      >
        <Card 
          data-tour="applicant-analytics-title"
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800"
        >
          <CardHeader className="pb-4">
            <div className="flex-1 min-w-0">
              <CardTitle 
                className="text-xl font-figtree font-extralight flex items-center gap-3 text-gray-900 dark:text-white mb-2"
              >
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
              <div data-tour="total-applicants" className="text-center">
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
                  For selected job
                </p>
              </div>
              <div data-tour="shortlisted" className="text-center">
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
              <div data-tour="flagged" className="text-center">
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
              <div data-tour="rejected" className="text-center">
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
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#2D2DDD] to-[#2D2DDD]/80 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform shadow-lg">
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
