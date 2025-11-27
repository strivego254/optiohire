'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { X, Plus, Calendar, Clock } from 'lucide-react'
import { JobPosting } from '@/types'

interface EditJobModalProps {
  isOpen: boolean
  onClose: () => void
  jobPosting: JobPosting | null
  onSave: (jobId: string, updatedData: Partial<JobPosting>) => void
}

export function EditJobModal({ isOpen, onClose, jobPosting, onSave }: EditJobModalProps) {
  const [formData, setFormData] = useState<Partial<JobPosting>>({})
  const [newSkill, setNewSkill] = useState('')

  useEffect(() => {
    if (jobPosting) {
      setFormData({
        job_title: jobPosting.job_title,
        job_description: jobPosting.job_description,
        required_skills: jobPosting.required_skills,
        interview_meeting_link: jobPosting.interview_meeting_link,
        application_deadline: jobPosting.application_deadline,
        status: jobPosting.status,
      })
    }
  }, [jobPosting])

  const handleInputChange = (field: keyof JobPosting, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.required_skills?.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        required_skills: [...(prev.required_skills || []), newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      required_skills: prev.required_skills?.filter(skill => skill !== skillToRemove) || []
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (jobPosting) {
      onSave(jobPosting.id, formData)
      onClose()
    }
  }

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
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <Card className="bg-white shadow-2xl">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-figtree font-extralight text-[#2D2DDD] dark:text-white">
                    Edit Job Posting
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
                  {/* Job Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                      Job Details
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="job_title">Job Title</Label>
                      <Input
                        id="job_title"
                        value={formData.job_title || ''}
                        onChange={(e) => handleInputChange('job_title', e.target.value)}
                        placeholder="e.g., Senior Software Engineer"
                        required
                        className="text-gray-900 dark:text-white dark:bg-gray-800 focus-visible:ring-[#2D2DDD] hover:border-[#2D2DDD]/50 focus-visible:border-[#2D2DDD]"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="job_description">Job Description</Label>
                      <Textarea
                        id="job_description"
                        value={formData.job_description || ''}
                        onChange={(e) => handleInputChange('job_description', e.target.value)}
                        placeholder="Describe the role, responsibilities, and requirements..."
                        rows={4}
                        required
                        className="text-gray-900 dark:text-white dark:bg-gray-800 focus-visible:ring-[#2D2DDD] hover:border-[#2D2DDD]/50 focus-visible:border-[#2D2DDD]"
                      />
                    </div>
                    
                    {/* Skills */}
                    <div className="space-y-2">
                      <Label>Required Skills</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                          className="text-gray-900 dark:text-white dark:bg-gray-800 focus-visible:ring-[#2D2DDD] hover:border-[#2D2DDD]/50 focus-visible:border-[#2D2DDD]"
                        />
                        <Button 
                          type="button" 
                          onClick={addSkill} 
                          variant="outline"
                          className="border-[#2D2DDD] text-[#2D2DDD] hover:bg-[#2D2DDD] hover:text-white dark:border-white dark:text-white dark:hover:bg-[#2D2DDD] dark:hover:text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.required_skills?.map((skill) => (
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

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <select
                        id="status"
                        value={formData.status || 'active'}
                        onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'paused' | 'closed')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2D2DDD] focus:border-[#2D2DDD] dark:text-white dark:border-gray-600 dark:bg-gray-800 hover:border-[#2D2DDD]/50"
                      >
                        <option value="active">Active</option>
                        <option value="paused">Paused</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  {/* Application Deadline */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#2D2DDD]" />
                      Application Deadline
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="application_deadline">Deadline Date & Time</Label>
                      <Input
                        id="application_deadline"
                        type="datetime-local"
                        value={formData.application_deadline ? new Date(formData.application_deadline).toISOString().slice(0, 16) : ''}
                        onChange={(e) => handleInputChange('application_deadline', e.target.value)}
                        className="text-gray-900 dark:text-white dark:bg-gray-800 focus-visible:ring-[#2D2DDD] hover:border-[#2D2DDD]/50 focus-visible:border-[#2D2DDD]"
                      />
                    </div>
                  </div>

                  {/* Interview Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-figtree font-semibold text-gray-900 dark:text-white">
                      Interview Details
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interview_meeting_link">Meeting Link (Optional)</Label>
                      <Input
                        id="interview_meeting_link"
                        value={formData.interview_meeting_link || ''}
                        onChange={(e) => handleInputChange('interview_meeting_link', e.target.value)}
                        placeholder="https://meet.google.com/..."
                        className="text-gray-900 dark:text-white dark:bg-gray-800 focus-visible:ring-[#2D2DDD] hover:border-[#2D2DDD]/50 focus-visible:border-[#2D2DDD]"
                      />
                    </div>
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex justify-end gap-3 pt-6 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onClose}
                      className="border-[#2D2DDD] text-[#2D2DDD] hover:bg-[#2D2DDD] hover:text-white dark:border-white dark:text-white dark:hover:bg-[#2D2DDD] dark:hover:text-white"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-[#2D2DDD] text-white hover:bg-[#2D2DDD] dark:bg-[#2D2DDD] dark:text-white dark:hover:bg-[#2D2DDD] shadow-none hover:shadow-none"
                    >
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

