'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { X, Calendar, Users, MapPin, Briefcase, Edit, ExternalLink, Clock } from 'lucide-react'
import { JobPosting } from '@/types'
import { formatDate, formatDateTime } from '@/lib/utils'

interface JobDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  jobPosting: JobPosting | null
  onEdit: (jobId: string) => void
}

export function JobDetailsModal({ isOpen, onClose, jobPosting, onEdit }: JobDetailsModalProps) {
  if (!jobPosting) return null

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
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-white shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-figtree font-extralight text-[#2D2DDD] dark:text-white">
                    Job Details
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 bg-[#2D2DDD] hover:bg-[#2D2DDD] shadow-none hover:shadow-none"
                  >
                    <X className="h-4 w-4 text-white" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h1 className="text-xl md:text-2xl font-figtree font-extralight mb-2 text-gray-900 dark:text-white">
                      {jobPosting.job_title}
                    </h1>
                    <Badge 
                      variant={
                        jobPosting.status?.toUpperCase() === 'ACTIVE' ? 'active' :
                        jobPosting.status?.toUpperCase() === 'DRAFT' ? 'draft' :
                        jobPosting.status?.toUpperCase() === 'CLOSED' ? 'closed' :
                        'default'
                      }
                      className="mb-4"
                    >
                      {jobPosting.status?.toUpperCase() || 'ACTIVE'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onEdit(jobPosting.id)}
                      className="flex items-center gap-2 bg-[#2D2DDD] text-white border-[#2D2DDD] hover:bg-[#2D2DDD] hover:border-[#2D2DDD] dark:bg-[#2D2DDD] dark:text-white dark:border-[#2D2DDD] dark:hover:bg-[#2D2DDD] shadow-none hover:shadow-none"
                    >
                      <Edit className="w-4 h-4 text-white" />
                      Edit
                    </Button>
                  </div>
                </div>

                {/* Job Description */}
                <div className="space-y-3">
                  <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                    Job Description
                  </h3>
                  <p className="text-gray-700 dark:text-gray-200 font-figtree font-light leading-relaxed">
                    {jobPosting.job_description}
                  </p>
                </div>

                {/* Required Skills */}
                <div className="space-y-3">
                  <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                    Required Skills
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(jobPosting.required_skills || []).map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Interview Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {jobPosting.application_deadline && (
                    <Card className="bg-[#2D2DDD]/10 border-[#2D2DDD]/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <Clock className="w-5 h-5 text-[#2D2DDD]" />
                          <h3 className="font-figtree font-semibold">Application Deadline</h3>
                        </div>
                        <p className="text-gray-700 dark:text-gray-200 font-figtree font-light">
                          {formatDateTime(jobPosting.application_deadline)}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {jobPosting.interview_start_time && (
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Calendar className="w-5 h-5 text-[#2D2DDD]" />
                          <h3 className="font-figtree font-semibold">Interview Start Time</h3>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 font-figtree font-light">
                          {formatDateTime(jobPosting.interview_start_time)}
                      </p>
                    </CardContent>
                  </Card>
                  )}

                  {jobPosting.interview_meeting_link && (
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <ExternalLink className="w-5 h-5 text-[#2D2DDD]" />
                          <h3 className="font-figtree font-semibold">Meeting Link</h3>
                        </div>
                        <a
                          href={jobPosting.interview_meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary/80 font-figtree font-light break-all"
                        >
                          {jobPosting.interview_meeting_link}
                        </a>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Additional Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Briefcase className="w-5 h-5 text-[#2D2DDD]" />
                        <h3 className="font-figtree font-semibold">Created</h3>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 font-figtree font-light">
                        {formatDate(jobPosting.created_at)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Users className="w-5 h-5 text-[#2D2DDD]" />
                        <h3 className="font-figtree font-semibold">Status</h3>
                      </div>
                      <p className="text-gray-700 dark:text-gray-200 font-figtree font-light">
                        {jobPosting.n8n_webhook_sent ? 'Webhook Sent' : 'Webhook Pending'}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Close Button */}
                <div className="flex justify-end pt-6 border-t">
                  <Button 
                    onClick={onClose}
                    className="bg-[#2D2DDD] text-white hover:bg-[#2D2DDD] dark:bg-[#2D2DDD] dark:text-white dark:hover:bg-[#2D2DDD] shadow-none hover:shadow-none"
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

