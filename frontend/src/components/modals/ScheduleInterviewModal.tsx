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

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'
      const response = await fetch(`${backendUrl}/api/schedule-interview`, {
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

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to schedule interview')
      }

      onSuccess()
      onClose()
      setInterviewTime('')
    } catch (err: any) {
      setError(err.message || 'Failed to schedule interview')
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
            Schedule an interview for {candidate?.candidate_name}
          </DialogDescription>
        </DialogHeader>

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
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !interviewTime}>
              {isLoading ? 'Scheduling...' : 'Schedule Interview'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

