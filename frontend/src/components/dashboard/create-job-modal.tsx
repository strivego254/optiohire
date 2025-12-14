'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Calendar, Briefcase, MapPin, Users, Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { JobPostingFormData } from '@/types'
import { SingleDateTimePicker } from '@/components/ui/single-date-time-picker'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAuth } from '@/hooks/use-auth'

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (jobData: JobPostingFormData) => Promise<{ job: any, company: any }>
}

export function CreateJobModal({ isOpen, onClose, onSubmit }: CreateJobModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState<JobPostingFormData>({
    company_name: '',
    company_email: '',
    hr_email: '',
    job_title: '',
    job_description: '',
    required_skills: [],
    interview_meeting_link: '',
    application_deadline: '',
  })

  // Pre-fill company info from user when modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({
        ...prev,
        company_name: user.companyName || prev.company_name,
        company_email: user.companyEmail || prev.company_email,
        hr_email: user.hrEmail || prev.hr_email,
      }))
    }
  }, [isOpen, user])

  const [newSkill, setNewSkill] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<{
    status: 'idle' | 'sending' | 'success' | 'error'
    message: string
  }>({ status: 'idle', message: '' })
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdJobInfo, setCreatedJobInfo] = useState<{ jobTitle: string; companyName: string } | null>(null)

  const handleInputChange = (field: keyof JobPostingFormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.required_skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...prev.required_skills, newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills.filter(skill => skill !== skillToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    if (!formData.company_name || formData.company_name.length < 2) {
      setWebhookStatus({ 
        status: 'error', 
        message: 'Company name must be at least 2 characters' 
      })
      return
    }
    
    if (!formData.job_title || formData.job_title.length < 3) {
      setWebhookStatus({ 
        status: 'error', 
        message: 'Job title must be at least 3 characters' 
      })
      return
    }
    
    if (!formData.job_description || formData.job_description.length < 50) {
      setWebhookStatus({ 
        status: 'error', 
        message: 'Job description must be at least 50 characters' 
      })
      return
    }
    
    if (!formData.required_skills || formData.required_skills.length === 0) {
      setWebhookStatus({ 
        status: 'error', 
        message: 'Please add at least one required skill' 
      })
      return
    }
    
    if (!formData.application_deadline) {
      setWebhookStatus({ 
        status: 'error', 
        message: 'Please select an application deadline' 
      })
      return
    }
    
    setIsSubmitting(true)
    setWebhookStatus({ status: 'sending', message: 'Creating job posting...' })

    try {
      setIsSubmitting(true)
      setWebhookStatus({ status: 'sending', message: 'Creating job posting...' })
      
      // Submit the job data to the parent component (this will save to database and auto-trigger webhook)
      const result = await onSubmit(formData)
      
      if (result && result.job) {
        // Store job info for success dialog
        setCreatedJobInfo({
          jobTitle: formData.job_title,
          companyName: formData.company_name
        })
        
        // Show success message with job details
        setWebhookStatus({ 
          status: 'success', 
          message: `✅ Success!\n\nJob Title: "${formData.job_title}"\nCompany: ${formData.company_name}\n\nJob has been created successfully and is now listed for progress tracking.` 
        })
        
        // Wait a moment to show success message, then show success dialog
        setTimeout(() => {
          setShowSuccessDialog(true)
        }, 1500)
      } else {
        throw new Error('Job creation did not return expected result')
      }
    } catch (error) {
      console.error('Error creating job posting:', error)
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while creating the job posting'
      setWebhookStatus({ 
        status: 'error', 
        message: errorMessage
      })
      // Don't close modal on error - let user see the error and retry
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-figtree font-extralight text-[#2D2DDD] dark:text-white">
                    Create New Job Posting
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Company Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                      Company Information
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company_name" className="text-gray-900 dark:text-white">Company Name</Label>
                        <Input
                          id="company_name"
                          value={formData.company_name}
                          onChange={(e) => handleInputChange('company_name', e.target.value)}
                          placeholder="Enter company name"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 hover:border-[#2D2DDD] focus-visible:border-[#2D2DDD] dark:focus-visible:border-gray-600 focus-visible:outline-none focus-visible:ring-0 border-focus-thin"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="company_email" className="text-gray-900 dark:text-white">Company Email</Label>
                        <Input
                          id="company_email"
                          type="email"
                          value={formData.company_email}
                          onChange={(e) => handleInputChange('company_email', e.target.value)}
                          placeholder="company@example.com"
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 hover:border-[#2D2DDD] focus-visible:border-[#2D2DDD] dark:focus-visible:border-gray-600 focus-visible:outline-none focus-visible:ring-0 border-focus-thin"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="hr_email" className="text-gray-900 dark:text-white">HR Email</Label>
                      <Input
                        id="hr_email"
                        type="email"
                        value={formData.hr_email}
                        onChange={(e) => handleInputChange('hr_email', e.target.value)}
                        placeholder="hr@example.com"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 hover:border-[#2D2DDD] focus-visible:border-[#2D2DDD] dark:focus-visible:border-gray-600 focus-visible:outline-none focus-visible:ring-0 border-focus-thin"
                        required
                      />
                    </div>
                  </div>

                  {/* Job Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                      Job Details
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="job_title" className="text-gray-900 dark:text-white">Job Title</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                        placeholder="e.g., Senior Software Engineer"
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 hover:border-[#2D2DDD] focus-visible:border-[#2D2DDD] dark:focus-visible:border-gray-600 focus-visible:outline-none focus-visible:ring-0 border-focus-thin"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="job_description" className="text-gray-900 dark:text-white">
                        Job Description <span className="text-gray-500 text-sm">(min 50 characters)</span>
                      </Label>
                      <Textarea
                        id="job_description"
                        value={formData.job_description}
                        onChange={(e) => handleInputChange('job_description', e.target.value)}
                        placeholder="Describe the role, responsibilities, and requirements... (at least 50 characters)"
                        rows={4}
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 hover:border-[#2D2DDD] focus-visible:border-[#2D2DDD] dark:focus-visible:border-gray-600 focus-visible:outline-none focus-visible:ring-0 border-focus-thin"
                        required
                        minLength={50}
                      />
                      {formData.job_description && formData.job_description.length < 50 && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                          {50 - formData.job_description.length} more characters needed
                        </p>
                      )}
                    </div>
                    
                    {/* Skills */}
                    <div className="space-y-2">
                      <Label className="text-gray-900 dark:text-white">
                        Required Skills <span className="text-gray-500 text-sm">(at least 1 required)</span>
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 hover:border-[#2D2DDD] focus-visible:border-[#2D2DDD] dark:focus-visible:border-gray-600 focus-visible:outline-none focus-visible:ring-0 border-focus-thin"
                        />
                        <Button type="button" onClick={addSkill} variant="outline" className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white border-[#2D2DDD] shadow-none hover:shadow-none">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.required_skills.map((skill) => (
                          <Badge
                            key={skill}
                            variant="secondary"
                            className="flex items-center gap-1"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              className="ml-1 hover:text-red-500"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Application Deadline */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#2D2DDD]" />
                      Application Deadline
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="application_deadline" className="text-gray-900 dark:text-white">Deadline Date & Time</Label>
                      <SingleDateTimePicker
                        value={formData.application_deadline}
                        onChange={(value) => handleInputChange('application_deadline', value)}
                        placeholder="Select application deadline and time"
                        minDateTime={new Date().toISOString().slice(0, 16)}
                      />
                    </div>
                  </div>

                  {/* Meeting Links */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                      Meeting Links
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Interview dates will be scheduled individually for each shortlisted candidate
                    </p>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interview_meeting_link" className="text-gray-900 dark:text-white">Default Meeting Link (Optional)</Label>
                      <Input
                        id="interview_meeting_link"
                        value={formData.interview_meeting_link}
                        onChange={(e) => handleInputChange('interview_meeting_link', e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 hover:border-[#2D2DDD] focus-visible:border-[#2D2DDD] dark:focus-visible:border-gray-600 focus-visible:outline-none focus-visible:ring-0 border-focus-thin"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        This will be used as the default meeting link when scheduling interviews for shortlisted candidates
                      </p>
                    </div>
                    
                  </div>

                  {/* Webhook Status */}
                  {webhookStatus.status !== 'idle' && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                      webhookStatus.status === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : webhookStatus.status === 'error'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}>
                      {webhookStatus.status === 'sending' && <Loader2 className="w-4 h-4 animate-spin-smooth" />}
                      {webhookStatus.status === 'success' && <CheckCircle className="w-4 h-4" />}
                      {webhookStatus.status === 'error' && <AlertCircle className="w-4 h-4" />}
                      <span className="text-sm font-figtree font-medium whitespace-pre-line">{webhookStatus.message}</span>
                    </div>
                  )}

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="bg-[#2D2DDD] hover:bg-[#2525B0] border-[#2D2DDD] hover:border-[#2525B0] text-white hover:text-white dark:bg-transparent dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:border-gray-500 dark:hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="flex items-center gap-2 bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isSubmitting ? 'Creating Job Posting...' : 'Create Job Posting'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
      
      {/* Success Confirmation Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-xl font-figtree text-gray-900 dark:text-white">
                Job Created Successfully!
              </DialogTitle>
            </div>
            <DialogDescription className="text-base text-gray-700 dark:text-gray-200 pt-2">
              <p className="mb-2 text-gray-900 dark:text-gray-100">
                The job posting <strong className="font-semibold text-gray-900 dark:text-white">"{createdJobInfo?.jobTitle}"</strong> has been successfully created for <strong className="font-semibold text-gray-900 dark:text-white">{createdJobInfo?.companyName}</strong>.
              </p>
              <p className="text-sm mt-3 text-gray-600 dark:text-gray-300">
                The job is now listed in your dashboard for progress tracking. You can monitor applications, review candidates, and track recruitment analytics.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setShowSuccessDialog(false)
                onClose()
                // Reset form and status
                setFormData({
                  company_name: '',
                  company_email: '',
                  hr_email: '',
                  job_title: '',
                  job_description: '',
                  required_skills: [],
                  interview_meeting_link: '',
                  application_deadline: '',
                })
                setWebhookStatus({ status: 'idle', message: '' })
                setCreatedJobInfo(null)
              }}
              className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white w-full sm:w-auto shadow-none hover:shadow-none"
            >
              View Job Listings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatePresence>
  )
}

