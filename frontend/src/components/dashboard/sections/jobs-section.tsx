'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  Plus, 
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Edit,
  Trash2,
  AlertTriangle,
  RefreshCw,
  Brain
} from 'lucide-react'
import { CreateJobModal } from '../create-job-modal'
import { JobDetailsModal } from '../job-details-modal'
import { EditJobModal } from '../edit-job-modal'
import { JobPosting, JobPostingFormData } from '@/types'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/use-auth'
import { useJobsRealtime, useApplicantsRealtime, useAnalyticsRealtime } from '@/hooks/use-realtime-data'

interface JobWithApplicants extends JobPosting {
  applicantStats: {
    total: number
    shortlisted: number
    flagged: number
    rejected: number
    pending: number
  }
  analytics?: string | null
  processingStatus?: 'processing' | 'in_progress' | 'finished'
}

export function JobsSection() {
  const { user } = useAuth()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null)
  const [jobs, setJobs] = useState<JobWithApplicants[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null)

  // Real-time updates for jobs and applicants
  useJobsRealtime(() => {
    console.log('🔄 Real-time job update detected, refreshing jobs...')
    refreshJobs()
  })

  useApplicantsRealtime(() => {
    console.log('🔄 Real-time applicant update detected, refreshing jobs...')
    refreshJobs()
  })

  useAnalyticsRealtime(() => {
    console.log('🔄 Real-time analytics update detected, refreshing jobs...')
    refreshJobs()
  })

  // Load jobs from database on component mount
  useEffect(() => {
    const loadJobs = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }
      
      try {
        setIsLoading(true)
        setError(null)
        
        console.log('🔄 Loading jobs for user:', user.id)
        
        // Get company for this user - try user_id first, then fallback to email
        let company = null
        let companyError = null
        
        // First try to find by user_id (preferred method)
        if (user.id) {
          const { data: companiesByUserId, error: errorByUserId } = await supabase
            .from('companies')
            .select('company_id, id, user_id, hr_email, company_email')
            .eq('user_id', user.id)
            .limit(1)
          
          if (!errorByUserId && companiesByUserId && companiesByUserId.length > 0) {
            company = companiesByUserId[0]
            console.log('✅ Found company by user_id:', company)
          } else {
            companyError = errorByUserId
          }
        }
        
        // Fallback to email-based lookup if user_id didn't work
        if (!company) {
          const { data: companiesByEmail, error: errorByEmail } = await supabase
            .from('companies')
            .select('company_id, id, user_id, hr_email, company_email')
            .or(`hr_email.eq.${user.email},company_email.eq.${user.email}`)
            .limit(1)
          
          if (!errorByEmail && companiesByEmail && companiesByEmail.length > 0) {
            company = companiesByEmail[0]
            console.log('✅ Found company by email:', company)
          } else {
            companyError = errorByEmail || companyError
          }
        }
        
        if (!company) {
          console.error('❌ Error fetching company:', companyError)
          console.log('💡 No company found for user:', user.id, 'email:', user.email)
          setError('No company found. Please create a job posting first.')
          setIsLoading(false)
          return
        }
        
        // Use company_id from schema (primary key) or fallback to id
        const companyId = company.company_id || company.id
        console.log('✅ Found company:', company, 'using company_id:', companyId)
        
        // Then get all job postings for this company
        const { data: jobPostings, error: jobsError } = await supabase
          .from('job_postings')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false })
        
        if (jobsError) {
          console.error('❌ Error fetching jobs:', jobsError)
          setError('Failed to load job postings')
          return
        }
        
        console.log('📋 Found job postings:', jobPostings?.length || 0, jobPostings)
        
        // Get applicant statistics for each job from recruitment_analytics and applicants tables
        const jobsWithApplicants: JobWithApplicants[] = []
        
        for (const job of jobPostings || []) {
          // Use job_posting_id if available, otherwise use id
          const jobId = job.job_posting_id || job.id
          
          // First try to get analytics from recruitment_analytics table
          const { data: analytics, error: analyticsError } = await supabase
            .from('recruitment_analytics')
            .select('total_applicants, total_applicants_shortlisted, total_applicants_rejected, total_applicants_flagged_to_hr, ai_overall_analysis, processing_status')
            .eq('job_posting_id', jobId)
            .single()
          
          // If analytics exist, use them; otherwise fall back to applicants table
          if (analytics && !analyticsError) {
            const applicantStats = {
              total: analytics.total_applicants || 0,
              shortlisted: analytics.total_applicants_shortlisted || 0,
              rejected: analytics.total_applicants_rejected || 0,
              flagged: analytics.total_applicants_flagged_to_hr || 0,
              pending: Math.max(0, (analytics.total_applicants || 0) - 
                (analytics.total_applicants_shortlisted || 0) - 
                (analytics.total_applicants_rejected || 0) - 
                (analytics.total_applicants_flagged_to_hr || 0)),
            }
            
            jobsWithApplicants.push({
              ...job,
              id: jobId, // Ensure id is set correctly
              applicantStats,
              analytics: analytics.ai_overall_analysis || null,
              processingStatus: analytics.processing_status || 'processing'
            })
          } else {
            // Fallback to applicants table if no analytics found
            const { data: applicants, error: applicantsError } = await supabase
              .from('applicants')
              .select('status')
              .eq('job_posting_id', jobId)
            
            const applicantStats = {
              total: applicants?.length || 0,
              shortlisted: applicants?.filter((a: { status: string }) => a.status === 'shortlisted').length || 0,
              flagged: applicants?.filter((a: { status: string }) => a.status === 'flagged').length || 0,
              rejected: applicants?.filter((a: { status: string }) => a.status === 'rejected').length || 0,
              pending: applicants?.filter((a: { status: string }) => a.status === 'pending').length || 0,
            }
            
            jobsWithApplicants.push({
              ...job,
              id: jobId, // Ensure id is set correctly
              applicantStats
            })
          }
        }
        
        console.log('✅ Processed jobs with applicants:', jobsWithApplicants.length)
        setJobs(jobsWithApplicants)
      } catch (err) {
        console.error('❌ Error loading jobs:', err)
        setError('An error occurred while loading jobs')
      } finally {
        setIsLoading(false)
      }
    }
    
    loadJobs()
  }, [user])

  // Add a refresh function that can be called externally
  const refreshJobs = async () => {
    console.log('🔄 Manual refresh triggered')
    if (!user) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Get company for this user - try user_id first, then fallback to email
      let company = null
      let companyError = null
      
      // First try to find by user_id (preferred method)
      if (user.id) {
        const { data: companiesByUserId, error: errorByUserId } = await supabase
          .from('companies')
          .select('company_id, id, user_id, hr_email, company_email')
          .eq('user_id', user.id)
          .limit(1)
        
        if (!errorByUserId && companiesByUserId && companiesByUserId.length > 0) {
          company = companiesByUserId[0]
          console.log('✅ Found company by user_id:', company)
        } else {
          companyError = errorByUserId
        }
      }
      
      // Fallback to email-based lookup if user_id didn't work
      if (!company) {
        const { data: companiesByEmail, error: errorByEmail } = await supabase
          .from('companies')
          .select('company_id, id, user_id, hr_email, company_email')
          .or(`hr_email.eq.${user.email},company_email.eq.${user.email}`)
          .limit(1)
        
        if (!errorByEmail && companiesByEmail && companiesByEmail.length > 0) {
          company = companiesByEmail[0]
          console.log('✅ Found company by email:', company)
        } else {
          companyError = errorByEmail || companyError
        }
      }
      
      if (!company) {
        console.error('❌ Error fetching company:', companyError)
        console.log('💡 No company found for user:', user.id, 'email:', user.email)
        setError('No company found. Please create a job posting first.')
        setIsLoading(false)
        return
      }
      
      // Use company_id from schema (primary key) or fallback to id
      const companyId = company.company_id || company.id
      console.log('🔍 Using company_id:', companyId, 'from company:', company)
      
      // Then get all job postings for this company
      const { data: jobPostings, error: jobsError } = await supabase
        .from('job_postings')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
      
      if (jobsError) {
        console.error('❌ Error fetching jobs:', jobsError)
        setError('Failed to load job postings')
        return
      }
      
      console.log('🔄 Refresh - Found job postings:', jobPostings?.length || 0)
      
      // Get applicant statistics for each job from recruitment_analytics and applicants tables
      const jobsWithApplicants: JobWithApplicants[] = []
      
      for (const job of jobPostings || []) {
        // Use job_posting_id if available, otherwise use id
        const jobId = job.job_posting_id || job.id
        
        // First try to get analytics from recruitment_analytics table
        const { data: analytics, error: analyticsError } = await supabase
          .from('recruitment_analytics')
          .select('total_applicants, total_applicants_shortlisted, total_applicants_rejected, total_applicants_flagged_to_hr, ai_overall_analysis, processing_status')
          .eq('job_posting_id', jobId)
          .single()
        
        // If analytics exist, use them; otherwise fall back to applicants table
        if (analytics && !analyticsError) {
          const applicantStats = {
            total: analytics.total_applicants || 0,
            shortlisted: analytics.total_applicants_shortlisted || 0,
            rejected: analytics.total_applicants_rejected || 0,
            flagged: analytics.total_applicants_flagged_to_hr || 0,
            pending: Math.max(0, (analytics.total_applicants || 0) - 
              (analytics.total_applicants_shortlisted || 0) - 
              (analytics.total_applicants_rejected || 0) - 
              (analytics.total_applicants_flagged_to_hr || 0)),
          }
          
          jobsWithApplicants.push({
            ...job,
            id: jobId, // Ensure id is set correctly
            applicantStats,
            analytics: analytics.ai_overall_analysis || null,
            processingStatus: analytics.processing_status || 'processing'
          })
        } else {
          // Fallback to applicants table if no analytics found
          const { data: applicants, error: applicantsError } = await supabase
            .from('applicants')
            .select('status')
            .eq('job_posting_id', jobId)
          
          const applicantStats = {
            total: applicants?.length || 0,
            shortlisted: applicants?.filter((a: { status: string }) => a.status === 'shortlisted').length || 0,
            flagged: applicants?.filter((a: { status: string }) => a.status === 'flagged').length || 0,
            rejected: applicants?.filter((a: { status: string }) => a.status === 'rejected').length || 0,
            pending: applicants?.filter((a: { status: string }) => a.status === 'pending').length || 0,
          }
          
          jobsWithApplicants.push({
            ...job,
            id: jobId, // Ensure id is set correctly
            applicantStats
          })
        }
      }
      
      console.log('✅ Refresh - Processed jobs:', jobsWithApplicants.length)
      setJobs(jobsWithApplicants)
    } catch (err) {
      console.error('❌ Error refreshing jobs:', err)
      setError('An error occurred while refreshing jobs')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateJob = async (jobData: JobPostingFormData) => {
    if (!user) {
      setError('You must be logged in to create jobs')
      throw new Error('You must be logged in to create jobs')
    }
    
    try {
      setError(null)
      
      const resp = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/job-postings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: jobData.company_name,
          company_email: jobData.company_email,
          hr_email: jobData.hr_email,
          job_title: jobData.job_title,
          job_description: jobData.job_description,
          required_skills: jobData.required_skills,
          application_deadline: jobData.application_deadline,
          meeting_link: jobData.interview_meeting_link || undefined
        })
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok || !data?.success) {
        // Extract detailed error message
        let errorMsg = 'Backend rejected the request'
        if (data?.error) {
          if (typeof data.error === 'string') {
            errorMsg = data.error
          } else if (data.error.message) {
            errorMsg = data.error.message
            if (data.error.details) {
              errorMsg += `: ${data.error.details}`
            }
          } else if (data.error.fieldErrors) {
            // Zod validation errors
            const fieldErrors = Object.entries(data.error.fieldErrors)
              .map(([field, errors]: [string, any]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ')
            errorMsg = `Validation failed: ${fieldErrors}`
          }
        }
        console.error('Job creation error:', data)
        throw new Error(errorMsg)
      }
      
      const jobPostingId: string = data.job_posting_id
      const companyId: string = data.company_id
      
      // Compose local job object for immediate UI feedback
      const composedJob: JobWithApplicants = {
        id: jobPostingId,
        created_at: new Date().toISOString(),
        company_id: companyId,
          company_name: jobData.company_name,
          company_email: jobData.company_email,
          hr_email: jobData.hr_email,
          job_title: jobData.job_title,
          job_description: jobData.job_description,
          required_skills: jobData.required_skills,
          interview_meeting_link: jobData.interview_meeting_link || null,
          application_deadline: jobData.application_deadline || null,
          status: 'active',
        n8n_webhook_sent: false,
        applicantStats: {
          total: 0,
          shortlisted: 0,
          flagged: 0,
          rejected: 0,
          pending: 0
        },
        analytics: null,
        processingStatus: 'processing'
      }
      
      console.log('✅ New job created via backend:', { jobPostingId, companyId })
      
      // Refresh jobs list to get the actual job from database
      // Await refresh to ensure job appears in list before showing success
      console.log('🔄 Refreshing jobs list after creation...')
      try {
        await refreshJobs()
        console.log('✅ Jobs list refreshed - new job should be visible')
      } catch (err) {
        console.error('Error refreshing jobs after creation:', err)
        // Don't throw - job was created successfully, refresh can happen later
      }
      
      return { job: composedJob, company: { id: companyId } }
    } catch (err) {
      console.error('Error creating job:', err)
      setError(err instanceof Error ? err.message : 'Failed to create job posting')
      throw err
    }
  }

  const handleViewDetails = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setIsDetailsModalOpen(true)
    }
  }

  const handleEditJob = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId)
    if (job) {
      setSelectedJob(job)
      setIsEditModalOpen(true)
    }
  }

  const handleSaveJob = async (jobId: string, updatedData: Partial<JobPosting>) => {
    try {
      setError(null)
      
      const { error } = await supabase
        .from('job_postings')
        .update(updatedData)
        .eq('id', jobId)
      
      if (error) {
        throw error
      }
      
      // Update local state
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, ...updatedData } : job
      ))
      console.log('Job updated in database:', updatedData)
    } catch (err) {
      console.error('Error updating job:', err)
      setError('Failed to update job posting')
    }
  }

  const handleDeleteJob = async (jobId: string) => {
    try {
      setError(null)
      console.log('Attempting to delete job:', jobId)
      
      // First, verify the job exists and belongs to the user's company
      if (!user) {
        throw new Error('User not authenticated')
      }
      
      const { data: company } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      if (!company) {
        throw new Error('Company not found for user')
      }
      
      // Check if job exists and belongs to user's company
      const { data: existingJob, error: fetchError } = await supabase
        .from('job_postings')
        .select('id, company_id')
        .eq('id', jobId)
        .eq('company_id', company.id)
        .single()
      
      if (fetchError || !existingJob) {
        console.warn('Job not found or does not belong to user:', jobId)
        // Still update UI in case it was already deleted
        setJobs(prev => prev.filter(job => job.id !== jobId))
        return
      }
      
      // Now attempt to delete
      const { data, error } = await supabase
        .from('job_postings')
        .delete()
        .eq('id', jobId)
        .eq('company_id', company.id) // Extra security check
        .select()
      
      console.log('Delete result:', { data, error })
      
      if (error) {
        console.error('Supabase delete error:', error)
        throw error
      }
      
      if (!data || data.length === 0) {
        console.warn('No rows were deleted - job might not exist or already deleted')
        // Still update UI in case it was already deleted
        setJobs(prev => prev.filter(job => job.id !== jobId))
        return
      }
      
      // Update local state
      setJobs(prev => prev.filter(job => job.id !== jobId))
      console.log('Job successfully deleted from database:', jobId)
      
      // Refresh jobs from database to ensure consistency
      setTimeout(async () => {
        try {
          if (!user) return
          
          const { data: company } = await supabase
            .from('companies')
            .select('id')
            .eq('user_id', user.id)
            .single()
          
          if (company) {
            const { data: jobPostings } = await supabase
              .from('job_postings')
              .select('*')
              .eq('company_id', company.id)
              .order('created_at', { ascending: false })
            
            setJobs(jobPostings || [])
            console.log('Jobs refreshed after deletion')
          }
        } catch (refreshErr) {
          console.error('Error refreshing jobs after deletion:', refreshErr)
        }
      }, 1000)
    } catch (err) {
      console.error('Error deleting job:', err)
      setError(`Failed to delete job posting: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-figtree font-extralight mb-2 text-[#2D2DDD] dark:text-white">
            Job Postings
          </h1>
          <p className="text-sm sm:text-base md:text-lg font-figtree font-light text-gray-600 dark:text-gray-400">
            Manage your active recruitment campaigns
          </p>
        </div>
        <div className="flex flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            onClick={refreshJobs}
            disabled={isLoading}
            size="sm"
            className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD]/90 hover:border-[#2D2DDD]/90 dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD]/90 flex-1 sm:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin-smooth' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="default" 
            size="sm"
            className="bg-[#2D2DDD] text-white hover:border-white hover:bg-[#2D2DDD] hover:text-white flex-1 sm:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Job
          </Button>
        </div>
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
            <div className="animate-spin-smooth rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading job postings...</p>
          </div>
        </motion.div>
      )}

      {/* Jobs List */}
      {!isLoading && (
        <div className="grid gap-6">
          {jobs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No job postings yet</h3>
              <p className="text-muted-foreground mb-6">
                Create your first job posting to start recruiting
              </p>
              <Button 
                variant="gradient" 
                onClick={() => setIsCreateModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Job
              </Button>
            </motion.div>
          ) : (
            jobs.map((job, index) => (
          <motion.div
            key={job.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
                        <Card className="hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-4 sm:p-6">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold font-figtree">{job.job_title}</h3>
                      <Badge 
                        variant={job.status === 'active' ? 'success' : job.status === 'paused' ? 'warning' : 'destructive'}
                      >
                        {job.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground font-figtree font-light mb-4">
                      {job.job_description}
                    </p>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground font-figtree font-light mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Interview: {new Date(job.interview_date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {Array.isArray(job.required_skills) ? job.required_skills.length : 0} skills required
                      </div>
                    </div>
                    
                    {/* AI Analysis Section */}
                    {job.analytics && (
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-5 h-5 text-blue-600" />
                          <h4 className="text-sm font-semibold text-gray-700 font-figtree">AI Analysis</h4>
                          {job.processingStatus && (
                            <Badge 
                              variant={job.processingStatus === 'finished' ? 'success' : 'warning'}
                              className="ml-auto"
                            >
                              {job.processingStatus === 'finished' ? 'Complete' : job.processingStatus}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 font-figtree font-light leading-relaxed">
                          {job.analytics}
                        </p>
                      </div>
                    )}
                    
                    {/* Processing Status Indicator */}
                    {job.processingStatus && job.processingStatus !== 'finished' && !job.analytics && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin-smooth rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                          <span className="text-sm text-yellow-700 font-figtree">
                            Processing applicant data... ({job.processingStatus})
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 mt-4 sm:mt-0">
                    <div className="flex flex-row gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditJob(job.id)}
                        className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD]/90 hover:border-[#2D2DDD]/90 dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD]/90 flex-1 sm:w-auto"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDetails(job.id)}
                        className="bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD]/90 hover:border-[#2D2DDD]/90 dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD]/90 flex-1 sm:w-auto"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Details
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setJobToDelete(job)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 dark:text-red-400 dark:hover:text-red-300 dark:border-red-800 dark:hover:bg-red-900/20 w-auto sm:w-auto"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
            ))
          )}
        </div>
      )}

      {/* Modals */}
      <CreateJobModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateJob}
      />

      <JobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false)
          setSelectedJob(null)
        }}
        jobPosting={selectedJob}
        onEdit={handleEditJob}
      />

      <EditJobModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedJob(null)
        }}
        jobPosting={selectedJob}
        onSave={handleSaveJob}
      />

      {/* Delete Confirmation Dialog */}
      {jobToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setJobToDelete(null)}
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Job Posting</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700 mb-2">
                Are you sure you want to delete the job posting for:
              </p>
              <div className="bg-gray-50 rounded-lg p-3">
                <h4 className="font-semibold text-gray-900">{jobToDelete.job_title}</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {jobToDelete.job_description.substring(0, 100)}...
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setJobToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  handleDeleteJob(jobToDelete.id)
                  setJobToDelete(null)
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Job
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
