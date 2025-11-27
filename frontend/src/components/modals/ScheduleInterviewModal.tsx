'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DateTimePicker } from '@/components/ui/date-time-picker'
import { useAuth } from '@/hooks/use-auth'
import type { Candidate } from '@/components/CandidateRow'
import { cleanCandidateName } from '@/lib/utils'

interface ScheduleInterviewModalProps {
  isOpen: boolean
  candidate: Candidate | null
  meetingLink: string
  onClose: () => void
  onSuccess: () => void
}

export function ScheduleInterviewModal({
  isOpen,
  candidate,
  meetingLink,
  onClose,
  onSuccess,
}: ScheduleInterviewModalProps) {
  const [interviewTime, setInterviewTime] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const { user } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!candidate || !interviewTime) return

    setError(null)
    setIsLoading(true)

    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Convert to ISO string with timezone
      const date = new Date(interviewTime)
      const isoString = date.toISOString()

      // Use Next.js API route instead of calling backend directly
      const response = await fetch('/api/schedule-interview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          applicantId: candidate.id,
          interviewTime: isoString,
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to schedule interview'
        let errorDetails = ''
        try {
          const data = await response.json()
          errorMessage = data.error || errorMessage
          errorDetails = data.details || data.message || ''
        } catch {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `Server error (${response.status})`
        }
        // Combine error message and details for better UX
        const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage
        throw new Error(fullError)
      }

      const data = await response.json()

      // Show success message
      setShowSuccess(true)
      
      // Wait a moment before closing and calling onSuccess
      setTimeout(() => {
        setShowSuccess(false)
        onSuccess()
        onClose()
        setInterviewTime('')
      }, 2000)
    } catch (err: any) {
      console.error('Schedule interview error:', err)
      
      // Handle network errors
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Network error: Unable to connect to server. Please check your connection and ensure the backend is running.')
      } else if (err.message) {
        setError(err.message)
      } else {
        setError('Failed to schedule interview. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const minDateTime = new Date().toISOString().slice(0, 16)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Schedule an interview for {candidate ? cleanCandidateName(candidate.candidate_name) : 'candidate'}
          </DialogDescription>
        </DialogHeader>

        {showSuccess ? (
          <div className="space-y-4 py-4">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Interview Scheduled Successfully!
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The interview has been scheduled for {candidate ? cleanCandidateName(candidate.candidate_name) : 'candidate'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="interview-time">Interview Date & Time</Label>
                <DateTimePicker
                  value={interviewTime}
                  onChange={setInterviewTime}
                  minDateTime={minDateTime}
                  placeholder="Select date and time"
                />
                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>

            <div className="space-y-2">
              <Label htmlFor="meeting-link">Meeting Link</Label>
              <Input
                id="meeting-link"
                value={meetingLink}
                readOnly
                className="bg-gray-50 dark:bg-gray-800"
              />
              <p className="text-xs text-gray-500">
                This is the shared meeting link for this job posting
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="bg-white text-[#2D2DDD] border-[#2D2DDD] hover:bg-[#2D2DDD] hover:text-white shadow-none hover:shadow-none"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !interviewTime}
              className="bg-[#2D2DDD] hover:bg-[#2D2DDD] text-white shadow-none hover:shadow-none"
            >
              {isLoading ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

